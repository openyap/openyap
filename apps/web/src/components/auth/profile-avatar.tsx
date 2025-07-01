import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { cn } from "~/lib/utils";

interface ProfileAvatarProps {
  readonly image: string;
  readonly name: string;
  readonly className?: string;
}

export function ProfileAvatar({ image, name, className }: ProfileAvatarProps) {
  return (
    <div>
      <Avatar className={cn(className)}>
        <AvatarImage src={image} />
        <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
    </div>
  );
}
