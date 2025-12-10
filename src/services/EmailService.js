const nodemailer = require("nodemailer");

// Khởi tạo transporter
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.MAIL_PORT) || 587,
  secure: process.env.MAIL_PORT == 465,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

/**
 * Gửi email xác nhận đặt tour
 * @param {Object} booking - Đối tượng booking
 * @param {Object} tour - Đối tượng tour
 */
const sendBookingConfirmationEmail = async (booking, tour) => {
  try {
    const departureDate = new Date(booking.departureDate).toLocaleDateString(
      "vi-VN"
    );
    const totalAmount = new Intl.NumberFormat("vi-VN").format(
      Math.round(booking.totalAmount)
    );

    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
            .button { background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Xác Nhận Đơn Đặt Tour</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${booking.contactInfo?.name}</strong>,</p>
              <p>Đơn đặt tour của bạn đã được xác nhận thành công! Chúng tôi rất vui được phục vụ bạn.</p>
              
              <h3>Chi Tiết Đơn Đặt Tour</h3>
              <div class="info-row">
                <span><strong>Mã Đơn:</strong></span>
                <span>${booking.bookingCode}</span>
              </div>
              <div class="info-row">
                <span><strong>Tên Tour:</strong></span>
                <span>${tour?.name}</span>
              </div>
              <div class="info-row">
                <span><strong>Ngày Khởi Hành:</strong></span>
                <span>${departureDate}</span>
              </div>
              <div class="info-row">
                <span><strong>Số Người:</strong></span>
                <span>${booking.numberOfPeople} người</span>
              </div>
              <div class="info-row">
                <span><strong>Tổng Tiền:</strong></span>
                <span style="color: #007bff; font-weight: bold;">${totalAmount} VND</span>
              </div>
              
              <p>Chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận thông tin chi tiết.</p>
              <p>Nếu có bất kỳ câu hỏi, vui lòng liên hệ với chúng tôi qua email này.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ${process.env.MAIL_SENDER}. Tất cả quyền được bảo lưu.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: `${process.env.MAIL_SENDER} <${process.env.MAIL_FROM}>`,
      to: booking.contactInfo?.email,
      subject: `Xác nhận đơn đặt tour - ${booking.bookingCode}`,
      html: htmlContent,
    });
    return { success: true, message: "Email xác nhận đã được gửi thành công" };
  } catch (error) {
    console.error("Send booking confirmation email error:", error);
    throw error;
  }
};

/**
 * Gửi email yêu cầu hoàn tiền được chấp nhận, vui lòng cung cấp thông tin
 * @param {Object} booking - Đối tượng booking
 */
const sendRefundRequestApprovedEmail = async (booking) => {
  try {
    const refundPercentage = booking.refundInfo?.refundPercentage || 0;
    const refundAmount = Math.round(
      booking.totalAmount * (refundPercentage / 100)
    );
    const refundAmountFormatted = new Intl.NumberFormat("vi-VN").format(
      refundAmount
    );

    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .header { background-color: #ffc107; color: #333; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; }
            .info-box { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Yêu Cầu Hoàn Tiền Được Chấp Nhận</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${booking.contactInfo?.name}</strong>,</p>
              <p>Yêu cầu hoàn tiền của bạn đã được xác nhận và chúng tôi đang xử lý.</p>
              
              <div class="info-box">
                <p><strong>Vui lòng cung cấp thông tin tài khoản ngân hàng để chúng tôi chuyển khoản hoàn tiền:</strong></p>
                <ul>
                  <li>Tên chủ tài khoản</li>
                  <li>Số tài khoản ngân hàng</li>
                  <li>Tên ngân hàng</li>
                  <li>Chi nhánh</li>
                </ul>
                <p>Vui lòng trả lời email này với thông tin tài khoản của bạn.</p>
              </div>
              
              <h3>Chi Tiết Hoàn Tiền</h3>
              <div class="info-row">
                <span><strong>Mã Đơn:</strong></span>
                <span>${booking.bookingCode}</span>
              </div>
              <div class="info-row">
                <span><strong>Lý Do:</strong></span>
                <span>${booking.refundInfo?.reason || "N/A"}</span>
              </div>
              <div class="info-row">
                <span><strong>Tỷ Lệ Hoàn Tiền:</strong></span>
                <span>${refundPercentage}%</span>
              </div>
              <div class="info-row">
                <span><strong>Số Tiền Hoàn:</strong></span>
                <span style="color: #28a745; font-weight: bold;">${refundAmountFormatted} VND</span>
              </div>
              
              <p>Sau khi nhận được thông tin tài khoản của bạn, chúng tôi sẽ xử lý hoàn tiền trong 3-5 ngày làm việc.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ${
                process.env.MAIL_SENDER
              }. Tất cả quyền được bảo lưu.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: `${process.env.MAIL_SENDER} <${process.env.MAIL_FROM}>`,
      to: booking.contactInfo?.email,
      subject: `Yêu cầu hoàn tiền được chấp nhận - ${booking.bookingCode}`,
      html: htmlContent,
    });
    return { success: true, message: "Email yêu cầu hoàn tiền đã được gửi" };
  } catch (error) {
    console.error("Send refund request approved email error:", error);
    throw error;
  }
};

/**
 * Gửi email hoàn tiền được duyệt
 * @param {Object} booking - Đối tượng booking
 * @param {number} refundAmount - Số tiền hoàn
 */
const sendRefundApprovedEmail = async (booking, refundAmount) => {
  try {
    const refundAmountFormatted = new Intl.NumberFormat("vi-VN").format(
      Math.round(refundAmount)
    );

    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .header { background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; }
            .success-box { background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Hoàn Tiền Đã Được Xử Lý</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${booking.contactInfo?.name}</strong>,</p>
              
              <div class="success-box">
                <p><strong>Hoàn tiền của bạn đã được chuyển thành công!</strong></p>
                <p>Số tiền sẽ hiện trong tài khoản ngân hàng của bạn trong vòng 3-5 ngày làm việc.</p>
              </div>
              
              <h3>Thông Tin Hoàn Tiền</h3>
              <div class="info-row">
                <span><strong>Mã Đơn:</strong></span>
                <span>${booking.bookingCode}</span>
              </div>
              <div class="info-row">
                <span><strong>Số Tiền Hoàn:</strong></span>
                <span style="color: #28a745; font-weight: bold;">${refundAmountFormatted} VND</span>
              </div>
              <div class="info-row">
                <span><strong>Ngày Xử Lý:</strong></span>
                <span>${new Date().toLocaleDateString("vi-VN")}</span>
              </div>
              
              <p>Nếu bạn không nhận được tiền sau 5 ngày, vui lòng liên hệ với chúng tôi ngay lập tức.</p>
              <p>Cảm ơn bạn đã tin tưởng chúng tôi!</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ${
                process.env.MAIL_SENDER
              }. Tất cả quyền được bảo lưu.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: `${process.env.MAIL_SENDER} <${process.env.MAIL_FROM}>`,
      to: booking.contactInfo?.email,
      subject: `Hoàn tiền đã được xử lý - ${booking.bookingCode}`,
      html: htmlContent,
    });
    return { success: true, message: "Email hoàn tiền đã được gửi thành công" };
  } catch (error) {
    console.error("Send refund approved email error:", error);
    throw error;
  }
};

/**
 * Gửi email hoàn tiền bị từ chối
 * @param {Object} booking - Đối tượng booking
 * @param {string} rejectionReason - Lý do từ chối
 */
const sendRefundRejectedEmail = async (booking, rejectionReason) => {
  try {
    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; }
            .warning-box { background-color: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin: 15px 0; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Yêu Cầu Hoàn Tiền Bị Từ Chối</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${booking.contactInfo?.name}</strong>,</p>
              
              <div class="warning-box">
                <p><strong>Rất tiếc, yêu cầu hoàn tiền của bạn không được chấp nhận.</strong></p>
              </div>
              
              <h3>Lý Do Từ Chối</h3>
              <p>${rejectionReason}</p>
              
              <h3>Thông Tin Đơn Đặt</h3>
              <p><strong>Mã Đơn:</strong> ${booking.bookingCode}</p>
              
              <p>Nếu bạn có bất kỳ câu hỏi hoặc thắc mắc, vui lòng liên hệ với chúng tôi để thảo luận thêm.</p>
              <p>Chúng tôi luôn sẵn lòng giúp đỡ bạn.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ${process.env.MAIL_SENDER}. Tất cả quyền được bảo lưu.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: `${process.env.MAIL_SENDER} <${process.env.MAIL_FROM}>`,
      to: booking.contactInfo?.email,
      subject: `Yêu cầu hoàn tiền bị từ chối - ${booking.bookingCode}`,
      html: htmlContent,
    });
    return { success: true, message: "Email từ chối hoàn tiền đã được gửi" };
  } catch (error) {
    console.error("Send refund rejected email error:", error);
    throw error;
  }
};

/**
 * Gửi email cảm ơn sau khi tour kết thúc
 * @param {Object} booking - Đối tượng booking
 * @param {Object} tour - Đối tượng tour
 */
const sendCompletionThankYouEmail = async (booking, tour) => {
  try {
    const departureDate = new Date(booking.departureDate).toLocaleDateString(
      "vi-VN"
    );

    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .header { background-color: #17a2b8; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; }
            .thank-you-box { background-color: #d1ecf1; padding: 15px; border-left: 4px solid #17a2b8; margin: 15px 0; text-align: center; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Cảm Ơn Bạn!</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${booking.contactInfo?.name}</strong>,</p>
              
              <div class="thank-you-box">
                <p style="font-size: 18px;">Cảm ơn bạn đã tin tưởng và lựa chọn tour du lịch của chúng tôi!</p>
              </div>
              
              <h3>Chi Tiết Tour</h3>
              <div class="info-row">
                <span><strong>Tên Tour:</strong></span>
                <span>${tour?.name}</span>
              </div>
              <div class="info-row">
                <span><strong>Ngày Khởi Hành:</strong></span>
                <span>${departureDate}</span>
              </div>
              <div class="info-row">
                <span><strong>Số Người Tham Gia:</strong></span>
                <span>${booking.numberOfPeople} người</span>
              </div>
              
              <p>Hy vọng bạn đã có những trải nghiệm tuyệt vời và những kỷ niệm đáng nhớ cùng chúng tôi.</p>
              <p>Chúng tôi rất mong được phục vụ bạn lần tiếp theo. Nếu có bất kỳ đề xuất hoặc ý kiến nào, vui lòng chia sẻ với chúng tôi.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ${process.env.MAIL_SENDER}. Tất cả quyền được bảo lưu.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: `${process.env.MAIL_SENDER} <${process.env.MAIL_FROM}>`,
      to: booking.contactInfo?.email,
      subject: `Cảm ơn bạn đã tham gia tour - ${tour?.name}`,
      html: htmlContent,
    });
    return { success: true, message: "Email cảm ơn đã được gửi thành công" };
  } catch (error) {
    console.error("Send completion thank you email error:", error);
    throw error;
  }
};

/**
 * Gửi email xác nhận thanh toán tại quầy
 * @param {Object} booking - Đối tượng booking
 * @param {Object} tour - Đối tượng tour
 */
const sendPaymentConfirmationEmail = async (booking, tour) => {
  try {
    const totalAmount = new Intl.NumberFormat("vi-VN").format(
      Math.round(booking.totalAmount)
    );

    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .header { background-color: #6f42c1; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; }
            .info-box { background-color: #e7e7ff; padding: 15px; border-left: 4px solid #6f42c1; margin: 15px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Xác Nhận Thanh Toán</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${booking.contactInfo?.name}</strong>,</p>
              <p>Cảm ơn bạn! Thanh toán của bạn đã được xác nhận thành công.</p>
              
              <div class="info-box">
                <p><strong>Chúng tôi sẽ xác nhận đơn tour sớm nhất và liên hệ với bạn để xác nhận thông tin chi tiết.</strong></p>
              </div>
              
              <h3>Chi Tiết Thanh Toán</h3>
              <div class="info-row">
                <span><strong>Mã Đơn:</strong></span>
                <span>${booking.bookingCode}</span>
              </div>
              <div class="info-row">
                <span><strong>Tour:</strong></span>
                <span>${tour?.name}</span>
              </div>
              <div class="info-row">
                <span><strong>Phương Thức:</strong></span>
                <span>Thanh toán tại quầy</span>
              </div>
              <div class="info-row">
                <span><strong>Số Tiền:</strong></span>
                <span style="color: #6f42c1; font-weight: bold;">${totalAmount} VND</span>
              </div>
              
              <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ${process.env.MAIL_SENDER}. Tất cả quyền được bảo lưu.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: `${process.env.MAIL_SENDER} <${process.env.MAIL_FROM}>`,
      to: booking.contactInfo?.email,
      subject: `Xác nhận thanh toán - ${booking.bookingCode}`,
      html: htmlContent,
    });
    return { success: true, message: "Email xác nhận thanh toán đã được gửi" };
  } catch (error) {
    console.error("Send payment confirmation email error:", error);
    throw error;
  }
};

module.exports = {
  sendBookingConfirmationEmail,
  sendRefundRequestApprovedEmail,
  sendRefundApprovedEmail,
  sendRefundRejectedEmail,
  sendCompletionThankYouEmail,
  sendPaymentConfirmationEmail,
};
