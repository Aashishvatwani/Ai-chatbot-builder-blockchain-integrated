import { Avatar } from "@/components/ui/avatar"

export default function Loading() {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
                <Avatar className="h-12 w-12 animate-pulse" />
                <p className="text-muted-foreground animate-pulse">Loading...</p>
            </div>
        </div>
    )
}