const crypto = require("crypto");
const https = require("https");
const momoConfig = require("../config/momo");

const PAYMENT_LIMITS = {
  MIN_AMOUNT: 1000,
  MAX_AMOUNT: 50000000,
};

class MoMoService {
  static generateSignature(rawSignature, secretKey) {
    return crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");
  }

  static buildRawSignature(params) {
    return (
      `accessKey=${params.accessKey}` +
      `&amount=${params.amount}` +
      `&extraData=${params.extraData}` +
      `&ipnUrl=${params.ipnUrl}` +
      `&orderId=${params.orderId}` +
      `&orderInfo=${params.orderInfo}` +
      `&partnerCode=${params.partnerCode}` +
      `&redirectUrl=${params.redirectUrl}` +
      `&requestId=${params.requestId}` +
      `&requestType=${params.requestType}`
    );
  }

  static async createPaymentRequest(bookingData) {
    try {
      let amount = Math.round(bookingData.amount);

      if (amount < PAYMENT_LIMITS.MIN_AMOUNT) {
        amount = PAYMENT_LIMITS.MIN_AMOUNT;
      } else if (amount > PAYMENT_LIMITS.MAX_AMOUNT) {
        amount = PAYMENT_LIMITS.MAX_AMOUNT;
      }

      const requestId = momoConfig.partnerCode + new Date().getTime();
      const orderId = requestId;

      const params = {
        partnerCode: momoConfig.partnerCode,
        accessKey: momoConfig.accessKey,
        requestId: requestId,
        amount: amount.toString(),
        orderId: orderId,
        orderInfo: `Tour Booking - ${bookingData.tourName} - ${bookingData.customerName}`,
        redirectUrl: momoConfig.redirectUrl,
        ipnUrl: momoConfig.ipnUrl,
        extraData: bookingData.bookingId || "",
        requestType: "payWithMethod",
        lang: "vi",
      };

      const rawSignature = this.buildRawSignature(params);

      const signature = this.generateSignature(
        rawSignature,
        momoConfig.secretKey
      );

      const requestBody = JSON.stringify({
        partnerCode: params.partnerCode,
        partnerName: momoConfig.partnerName,
        storeId: momoConfig.storeId,
        requestId: params.requestId,
        amount: params.amount,
        orderId: params.orderId,
        orderInfo: params.orderInfo,
        redirectUrl: params.redirectUrl,
        ipnUrl: params.ipnUrl,
        lang: params.lang,
        requestType: params.requestType,
        autoCapture: momoConfig.autoCapture,
        extraData: params.extraData,
        signature: signature,
      });

      return await this.sendMoMoRequest(requestBody);
    } catch (error) {
      console.error("MoMo payment request error:", error);
      throw error;
    }
  }

  static sendMoMoRequest(requestBody) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: "test-payment.momo.vn",
        port: 443,
        path: "/v2/gateway/api/create",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(requestBody),
        },
      };

      const req = https.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const response = JSON.parse(data);
            if (response.payUrl) {
              resolve(response);
            } else {
              reject(
                new Error(response.message || "MoMo payment creation failed")
              );
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.write(requestBody);
      req.end();
    });
  }

  static verifySignature(callbackData) {
    try {
      const {
        amount,
        extraData,
        message,
        orderId,
        orderInfo,
        orderType,
        partnerCode,
        payType,
        requestId,
        responseTime,
        resultCode,
        transId,
        signature,
      } = callbackData;

      const receivedSignature = signature;

      const rawSignature =
        `accessKey=${momoConfig.accessKey}` +
        `&amount=${amount}` +
        `&extraData=${extraData}` +
        `&message=${message}` +
        `&orderId=${orderId}` +
        `&orderInfo=${orderInfo}` +
        `&orderType=${orderType}` +
        `&partnerCode=${partnerCode}` +
        `&payType=${payType}` +
        `&requestId=${requestId}` +
        `&responseTime=${responseTime}` +
        `&resultCode=${resultCode}` +
        `&transId=${transId}`;

      const computedSignature = this.generateSignature(
        rawSignature,
        momoConfig.secretKey
      );

      return computedSignature === receivedSignature;
    } catch (error) {
      console.error("Error verifying signature:", error);
      return false;
    }
  }
}

module.exports = MoMoService;
module.exports.PAYMENT_LIMITS = PAYMENT_LIMITS;
