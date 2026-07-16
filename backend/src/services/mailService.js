import nodemailer from 'nodemailer';

const required = (name) => {
    const value = process.env[name];
    if (!value) throw new Error(`Missing email config: ${name}`);
    return value;
};

const createTransport = () => nodemailer.createTransport({
    host: required('SMTP_HOST'),
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: {
        user: required('SMTP_USER'),
        pass: required('SMTP_PASS'),
    },
});

export const sendPasswordResetCode = async ({ to, code, ttlMinutes }) => {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    if (!from) throw new Error('Missing email config: SMTP_FROM');

    const transporter = createTransport();
    await transporter.sendMail({
        from,
        to,
        subject: 'Mã xác minh mật khẩu TMS',
        text: [
            'Bạn đang yêu cầu xác minh thao tác mật khẩu cho hệ thống TMS.',
            `Mã xác minh của bạn là: ${code}`,
            `Mã này có hiệu lực trong ${ttlMinutes} phút và chỉ sử dụng một lần.`,
            'Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email này.',
        ].join('\n'),
        html: `
            <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
                <h2>Xác minh mật khẩu TMS</h2>
                <p>Mã xác minh của bạn:</p>
                <p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p>
                <p>Mã có hiệu lực trong <strong>${ttlMinutes} phút</strong> và chỉ sử dụng một lần.</p>
                <p>Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email này.</p>
            </div>
        `,
    });
};
