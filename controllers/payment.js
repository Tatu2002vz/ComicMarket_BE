const asyncHandler = require("express-async-handler");
const Payment = require("../models/payment");
const user = require("../models/user");
const sttCode = require('../enum/statusCode')
const createPaymentUrl = asyncHandler(async (req, res) => {
  var ipAddr =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  var tmnCode = process.env.vnp_TmnCode;
  var secretKey = process.env.vnp_HashSecret;
  var vnpUrl = process.env.vnp_VnpUrl;
  var returnUrl = "http://localhost:3000/payment";
  var date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  // Tạo chuỗi ngày giờ theo định dạng "yyyymmddHHmmss"
  const createDate = `${year}${month}${day}${hour}${minute}${second}`;

  // Tạo mã đơn hàng theo định dạng "HHmmss"
  const orderId = `${hour}${minute}${second}`;
  var amount = req.body.amount;
  var bankCode = req.body.bankCode;

  var orderInfo = req.body.orderDescription;
  var orderType = req.body.orderType;
  var locale = req.body.language;
  if (locale === null || locale === "") {
    locale = "vn";
  }
  var currCode = "VND";
  var vnp_Params = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = tmnCode;
  // vnp_Params['vnp_Merchant'] = ''
  vnp_Params["vnp_Locale"] = "vn";
  vnp_Params["vnp_CurrCode"] = currCode;
  vnp_Params["vnp_TxnRef"] = orderId;
  vnp_Params["vnp_OrderInfo"] = "Thanh toan";
  vnp_Params["vnp_OrderType"] = "other";
  vnp_Params["vnp_Amount"] = amount * 100;
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_IpAddr"] = ipAddr;
  vnp_Params["vnp_CreateDate"] = createDate;
  if (bankCode !== null && bankCode !== "" && bankCode !== undefined) {
    vnp_Params["vnp_BankCode"] = bankCode;
  }

  vnp_Params = sortObject(vnp_Params);

  let querystring = require("qs");
  let signData = querystring.stringify(vnp_Params, { encode: false });
  let crypto = require("crypto");
  let hmac = crypto.createHmac("sha512", secretKey);
  let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;
  vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

  return res.status(sttCode.Ok).json({
    success: true,
    mes: vnpUrl,
  });
});

const vnpayIPN = asyncHandler((req, res) => {
  var vnp_Params = req.body;
  var secureHash = vnp_Params["vnp_SecureHash"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = sortObject(vnp_Params);

  var secretKey = process.env.vnp_HashSecret;

  var querystring = require("qs");
  var signData = querystring.stringify(vnp_Params, { encode: false });
  var crypto = require("crypto");
  var hmac = crypto.createHmac("sha512", secretKey);
  var signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

  if (secureHash === signed) {
    var orderId = vnp_Params["vnp_TxnRef"];
    var rspCode = vnp_Params["vnp_ResponseCode"];
    //Kiem tra du lieu co hop le khong, cap nhat trang thai don hang va gui ket qua cho VNPAY theo dinh dang duoi
    res.status(200).json({ RspCode: "00", Message: "success" });
  } else {
    res.status(200).json({ RspCode: "97", Message: "Fail checksum" });
  }
});

const vnpayReturn = asyncHandler(async (req, res) => {
  var vnp_Params = req.body;
  var secureHash = vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];
  console.log(vnp_Params);
  vnp_Params = sortObject(vnp_Params);
  var tmnCode = process.env.vnp_TmnCode;
  var secretKey = process.env.vnp_HashSecret;
  var querystring = require("qs");
  var signData = querystring.stringify(vnp_Params, { encode: false });
  var crypto = require("crypto");
  var hmac = crypto.createHmac("sha512", secretKey);
  var signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
  if (secureHash === signed) {
    //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua
    const id =
      vnp_Params["vnp_BankTranNo"] + "-" + vnp_Params["vnp_TransactionNo"];
    const checkExist = await Payment.findOne({ transactionID: id });
    if (checkExist) {
      return res.status(statusCode.Ok).json({
        success: true,
        mes: "01",
      });
    } else {
      const data = {
        transactionID: id,
        user: req.user._id,
        amount: Number(vnp_Params["vnp_Amount"]) / 100,
      };
      const newPayment = await Payment.create(data);
      if (newPayment) {
        await user.findByIdAndUpdate(
          req.user._id,
          {
            $inc: {
              walletBalance: +(Number(vnp_Params["vnp_Amount"]) / 10000),
            },
          },
          { new: true }
        );
      }
      return res.status(statusCode.Ok).json({
        success: true,
        mes: "00",
      });
    }
  } else {
    return res.status(statusCode.Ok).json({
      success: false,
      mes: "Đã có lỗi xảy ra!",
    });
    // res.render("success", { code: "97" });
  }
});
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}
module.exports = {
  createPaymentUrl,
  vnpayReturn,
  vnpayIPN,
};
