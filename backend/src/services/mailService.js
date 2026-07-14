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
        subject: 'Ma xac minh dat lai mật khẩu TMS',
        text: [
            'Ban dang yeu cau dat lai mật khẩu cho he thong TMS.',
            `Ma xac minh cua ban la: ${code}`,
            `Ma nay co hieu luc trong ${ttlMinutes} phut va chi su dung mot lan.`,
            'Neu ban khong yeu cau thao tac nay, hay bo qua email nay.',
        ].join('\n'),
        html: `
            <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
                <h2>Dat lai mật khẩu TMS</h2>
                <p>Ma xac minh cua ban:</p>
                <p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p>
                <p>Ma co hieu luc trong <strong>${ttlMinutes} phut</strong> va chi su dung mot lan.</p>
                <p>Neu ban khong yeu cau thao tac nay, hay bo qua email nay.</p>
            </div>
        `,
    });
};
