import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel,  } from '@/components/ui/field';

const playerSchema = z.object({
    name: z.string().min(1, "Họ tên không được để trống"),
    birthYear: z.number().min(1900, "Năm sinh hợp lệ"),
    gender: z.enum(["male", "female", "other"]),
    skillLevel: z.number().min(1).max(5),
});

const orgSchema = z.object({
    orgName: z.string().min(1, "Tên tổ chức không được để trống"),
    phone: z.string().optional(),
    address: z.string().optional(),
});

const refereeSchema = z.object({
    name: z.string().min(1, "Họ tên không được để trống"),
    birthDay: z.string().min(1, "Ngày sinh không được để trống"),
    gender: z.enum(["male", "female", "other"]),
    experienceYears: z.number().min(0),
});

type PlayerData = z.infer<typeof playerSchema>;
type OrgData = z.infer<typeof orgSchema>;
type RefereeData = z.infer<typeof refereeSchema>;

export function SignupStep2({ role, onSubmit, onBack }: { role: string; onSubmit: (data: PlayerData | OrgData | RefereeData) => void; onBack: () => void }) {
    let schema;
    if (role === 'player') schema = playerSchema;
    else if (role === 'org') schema = orgSchema;
    else schema = refereeSchema;

    const { register, handleSubmit } = useForm({
        resolver: zodResolver(schema!),
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {role === 'player' && (
                <>
                    <Field><FieldLabel>Họ tên</FieldLabel><Input {...register("name")} /></Field>
                    <Field><FieldLabel>Năm sinh</FieldLabel><Input type="number" {...register("birthYear", { valueAsNumber: true })} /></Field>
                    <Field><FieldLabel>Giới tính</FieldLabel>
                        <select {...register("gender")} className="border rounded p-2">
                            <option value="male">Nam</option><option value="female">Nữ</option><option value="other">Khác</option>
                        </select>
                    </Field>
                    <Field><FieldLabel>Kỹ năng (1-5)</FieldLabel><Input type="number" step="0.5" {...register("skillLevel", { valueAsNumber: true })} /></Field>
                </>
            )}
            {role === 'org' && (
                <>
                    <Field><FieldLabel>Tên tổ chức</FieldLabel><Input {...register("orgName")} /></Field>
                    <Field><FieldLabel>Số điện thoại</FieldLabel><Input {...register("phone")} /></Field>
                    <Field><FieldLabel>Địa chỉ</FieldLabel><Input {...register("address")} /></Field>
                </>
            )}
            {role === 'referee' && (
                <>
                    <Field><FieldLabel>Họ tên</FieldLabel><Input {...register("name")} /></Field>
                    <Field><FieldLabel>Ngày sinh</FieldLabel><Input type="date" {...register("birthDay")} /></Field>
                    <Field><FieldLabel>Giới tính</FieldLabel>
                        <select {...register("gender")} className="border rounded p-2">
                            <option value="male">Nam</option><option value="female">Nữ</option><option value="other">Khác</option>
                        </select>
                    </Field>
                    <Field><FieldLabel>Số năm kinh nghiệm</FieldLabel><Input type="number" {...register("experienceYears", { valueAsNumber: true })} /></Field>
                </>
            )}
            <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onBack}>Quay lại</Button>
                <Button type="submit">Hoàn tất đăng ký</Button>
            </div>
        </form>
    );
}
