module.exports = {
  // MoMo Sandbox Configuration
  partnerCode: process.env.MOMO_PARTNER_CODE || "MOMO",
  partnerName: process.env.MOMO_PARTNER_NAME || "TraverSmart",
  storeId: process.env.MOMO_STORE_ID || "TraverSmartStore",
  accessKey: process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85",
  secretKey: process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz",
  endpoint: "https://test-payment.momo.vn/v2/gateway/api/create",
  redirectUrl:
    process.env.MOMO_REDIRECT_URL || "http://localhost:8386/booking-success",
  ipnUrl:
    process.env.MOMO_IPN_URL ||
    "http://localhost:8386/api/bookings/momo-callback",
  requestType: "payWithMethod", // Cho phép user chọn phương thức: ví MoMo, ngân hàng, etc
  autoCapture: true,
  lang: "vi",
};
