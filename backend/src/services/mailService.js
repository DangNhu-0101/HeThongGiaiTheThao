import nodemailer from 'nodemailer';

const required = (name) => {
    const value = String(process.env[name] || '').trim();
    if (!value) throw new Error(`Thiếu cấu hình email ${name}`);
    return value;
};

const smtpPort = () => {
    const port = Number(process.env.SMTP_PORT || 587);
    if (!Number.isInteger(port) || port <= 0) throw new Error('SMTP_PORT không hợp lệ');
    return port;
};

const createTransport = () => {
    const port = smtpPort();
    const secure = process.env.SMTP_SECURE === undefined
        ? port === 465
        : String(process.env.SMTP_SECURE).toLowerCase() === 'true';
    return nodemailer.createTransport({
        host: required('SMTP_HOST'),
        port,
        secure,
        auth: { user: required('SMTP_USER'), pass: required('SMTP_PASS') },
        connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10000),
        greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10000),
        socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 20000),
    });
};

export const verifyMailConfiguration = async () => {
    const transporter = createTransport();
    await transporter.verify();
    return true;
};

export const sendPasswordResetCode = async ({ to, code, ttlMinutes }) => {
    const from = String(process.env.SMTP_FROM || process.env.SMTP_USER || '').trim();
    if (!from) throw new Error('Thiếu cấu hình email SMTP_FROM');
    const transporter = createTransport();
    const info = await transporter.sendMail({
        from,
        to,
        subject: 'Mã xác minh mật khẩu TMS',
        text: `Mã xác minh của bạn là ${code}. Mã có hiệu lực trong ${ttlMinutes} phút và chỉ sử dụng một lần.`,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a"><h2>Xác minh mật khẩu TMS</h2><p>Mã xác minh của bạn:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>Mã có hiệu lực trong <strong>${ttlMinutes} phút</strong> và chỉ sử dụng một lần.</p><p>Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email.</p></div>`,
    });
    if (!Array.isArray(info.accepted) || info.accepted.length === 0) throw new Error(`Máy chủ SMTP không chấp nhận người nhận ${to}`);
    return info;
};
