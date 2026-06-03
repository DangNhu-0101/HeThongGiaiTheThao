// src/components/TeamRegistrationForm.tsx
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTournamentStore } from "@/stores/useTournamentStore";
import { useTeamStore } from "@/stores/useTeamStore";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/libs/utils";


interface User {
    id: string;
    username: string;
    email: string;
    avatar?: string;
}


export function TeamRegistrationForm() {
    const { tournaments, getAllTournaments, loading: tournamentLoading } = useTournamentStore();
    const { createTeam, sendInvitation, searchUsers, loading: teamLoading } = useTeamStore();


    // Form state
    const [tournamentId, setTournamentId] = useState("");
    const [teamName, setTeamName] = useState("");
    const [sportCategory, setSportCategory] = useState("");
    const [logoBase64, setLogoBase64] = useState("");
    const [logoPreview, setLogoPreview] = useState<string | null>(null);


    // User search & invitation
    const [userSearchOpen, setUserSearchOpen] = useState(false);
    const [userSearchKeyword, setUserSearchKeyword] = useState("");
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);


    // Load tournaments on mount
    useEffect(() => {
        getAllTournaments();
    }, [getAllTournaments]);


    // Debounced search users
    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (userSearchKeyword.trim().length >= 2) {
                setIsSearching(true);
                try {
                    const users = await searchUsers(userSearchKeyword);
                    setSearchResults(users as User[]);
                } catch (err) {
                    console.error(err);
                    setSearchResults([]);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [userSearchKeyword, searchUsers]);


    // Handle logo file change
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setLogoPreview(base64);
                setLogoBase64(base64);
            };
            reader.readAsDataURL(file);
        } else {
            setLogoPreview(null);
            setLogoBase64("");
        }
    };


    const addUser = (user: User) => {
        if (selectedUsers.some((u) => u.id === user.id)) {
            toast.warning("Người dùng đã có trong danh sách");
            return;
        }
        setSelectedUsers((prev) => [...prev, user]);
        setUserSearchOpen(false);
        setUserSearchKeyword("");
    };


    const removeUser = (userId: string) => {
        setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
    };


    const validateForm = () => {
        if (!tournamentId) {
            toast.error("Vui lòng chọn giải đấu");
            return false;
        }
        if (!teamName.trim() || teamName.length < 3) {
            toast.error("Tên đội phải có ít nhất 3 ký tự");
            return false;
        }
        if (!sportCategory.trim()) {
            toast.error("Vui lòng nhập thể loại môn thể thao");
            return false;
        }
        if (selectedUsers.length === 0) {
            toast.warning("Vui lòng mời ít nhất một thành viên");
            return false;
        }
        return true;
    };


    const onSubmit = async () => {
        if (!validateForm()) return;


        try {
            // Step 1: Create team
            await createTeam({
                name: teamName.trim(),
                tournamentId,
                sportCategory: sportCategory.trim(),
                logo: logoBase64,
            });


            // Get the newly created team from store (assuming createTeam refreshes userTeams)
            const { userTeams } = useTeamStore.getState();
            const newTeam = userTeams.find(
                (t) => t.name === teamName.trim() && t._id === tournamentId
            );
            if (!newTeam) {
                throw new Error("Không tìm thấy đội vừa tạo");
            }
            const teamId = newTeam._id;


            // Step 2: Send invitations
            const invitationPromises = selectedUsers.map((user) =>
                sendInvitation(teamId, user.id, `Mời bạn tham gia đội ${teamName.trim()}`)
            );
            await Promise.all(invitationPromises);


            toast.success(`Tạo đội thành công! Đã gửi ${selectedUsers.length} lời mời.`);


            // Reset form
            setTournamentId("");
            setTeamName("");
            setSportCategory("");
            setLogoBase64("");
            setLogoPreview(null);
            setSelectedUsers([]);
        } catch {
            toast.error( "Có lỗi xảy ra");
        }
    };


    const isLoading = tournamentLoading || teamLoading;


    return (
        <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>Đăng ký đội thi đấu</CardTitle>
                <CardDescription>Tạo đội mới và mời thành viên tham gia</CardDescription>
            </CardHeader>


            <CardContent className="space-y-6">
                {/* Tournament selection */}
                <div className="space-y-2">
                    <Label>Giải đấu</Label>
                    <Select onValueChange={setTournamentId} value={tournamentId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Chọn giải đấu" />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.isArray(tournaments) && tournaments.map((t: { _id: string; name: string }) => (
                                <SelectItem key={t._id} value={t._id}>
                                    {t.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>


                {/* Team name */}
                <div className="space-y-2">
                    <Label>Tên đội</Label>
                    <Input
                        placeholder="VD: Đội Pickleball Hưng Thịnh"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                    />
                </div>


                {/* Sport category */}
                <div className="space-y-2">
                    <Label>Thể loại môn thể thao</Label>
                    <Input
                        placeholder="VD: Pickleball Đôi Nam"
                        value={sportCategory}
                        onChange={(e) => setSportCategory(e.target.value)}
                    />
                </div>


                {/* Logo upload */}
                <div className="space-y-2">
                    <Label>Logo đội</Label>
                    <Input type="file" accept="image/*" onChange={handleLogoChange} className="cursor-pointer" />
                    {logoPreview && (
                        <div className="mt-2">
                            <img src={logoPreview} alt="Logo preview" className="h-20 w-20 object-contain rounded-md border" />
                        </div>
                    )}
                </div>


                {/* Search and add users */}
                <div className="space-y-3">
                    <Label>Mời thành viên</Label>
                    <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={userSearchOpen} className="w-full justify-between">
                                {userSearchKeyword || "Tìm kiếm người chơi..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                            <Command>
                                <CommandInput placeholder="Nhập tên, email..." value={userSearchKeyword} onValueChange={setUserSearchKeyword} />
                                <CommandList>
                                    <CommandEmpty>{isSearching ? "Đang tìm..." : "Không tìm thấy người dùng"}</CommandEmpty>
                                    <CommandGroup>
                                        {searchResults.map((user) => (
                                            <CommandItem key={user.id} value={user.id} onSelect={() => addUser(user)}>
                                                <Avatar className="mr-2 h-6 w-6">
                                                    <AvatarImage src={user.avatar} />
                                                    <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <span>{user.username}</span>
                                                <span className="ml-2 text-xs text-muted-foreground">{user.email}</span>
                                                <Check
                                                    className={cn(
                                                        "ml-auto h-4 w-4",
                                                        selectedUsers.some((u) => u.id === user.id) ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>


                    {/* List selected users */}
                    {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {selectedUsers.map((user) => (
                                <Badge key={user.id} variant="secondary" className="gap-1 pl-1 pr-2">
                                    <Avatar className="h-5 w-5">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span>{user.username}</span>
                                    <X className="h-3 w-3 cursor-pointer ml-1 hover:text-red-500" onClick={() => removeUser(user.id)} />
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>


            <CardFooter>
                <Button onClick={onSubmit} className="w-full" disabled={isLoading}>
                    {isLoading ? "Đang xử lý..." : "Tạo đội và gửi lời mời"}
                </Button>
            </CardFooter>
        </Card>
    );
}
