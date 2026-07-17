import { CalendarDays, MapPin, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function TournamentItem() {

    


    return (
        <div className="flex min-h-[400px] w-full items-center justify-center p-4">
            <Card className="group w-full max-w-xl overflow-hidden border-0 shadow-xl transition-all duration-300 hover:shadow-2xl dark:bg-gray-900/90">
                {/* Decorative top bar with gradient */}
                <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

                <CardHeader className="space-y-2 pb-2">
                    <div className="flex items-center justify-between">
                        {/* Status Badge - "SÁP DIỆN RA" (Coming Soon) */}
                        <Badge
                            variant="secondary"
                            className="border-l-4 border-red-500 bg-red-50 px-3 py-1 text-sm font-semibold uppercase text-red-700 shadow-sm dark:bg-red-950/40 dark:text-red-300"
                        >
                            🏓 SẮP DIỄN RA
                        </Badge>

                        {/* Season indicator */}
                        <Badge
                            variant="outline"
                            className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
                        >
                            <Trophy className="mr-1 h-3 w-3" />
                            {}
                        </Badge>
                    </div>

                    {/* Main Tournament Title */}
                    <div className="space-y-1">
                        <h3 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                            {}
                        </h3>
                        <p className="text-sm font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
                            {}
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Event details grid */}
                    <div className="grid gap-3">
                        {/* Date */}
                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                            <div className="rounded-full bg-gray-100 p-1.5 dark:bg-gray-800">
                                <CalendarDays className="h-4 w-4 text-amber-600" />
                            </div>
                            <span className="text-sm font-medium">{}</span>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                            <div className="rounded-full bg-gray-100 p-1.5 dark:bg-gray-800">
                                <MapPin className="h-4 w-4 text-amber-600" />
                            </div>
                            <span className="text-sm font-medium">{}</span>
                        </div>

                        {/* Categories */}
                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                            <div className="rounded-full bg-gray-100 p-1.5 dark:bg-gray-800">
                                <Users className="h-4 w-4 text-amber-600" />
                            </div>
                            <span className="text-sm font-medium">{}</span>
                        </div>
                    </div>

                    {/* Deadline notice */}
                    <div className="mt-2 rounded-lg bg-amber-50 p-2 text-center text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                        ⏰ Registration deadline: {}
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-between">
                    <Button
                        variant="default"
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 font-semibold shadow-md transition-all hover:scale-105 hover:from-amber-700 hover:to-orange-700 sm:w-auto"
                    >
                        Register Now
                        <svg
                            className="ml-2 h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                        </svg>
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/30 sm:w-auto"
                    >
                        View Details
                    </Button>
                </CardFooter>

                {/* Subtle animated pulse effect on hover */}
                <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </Card>
        </div>
    );
}