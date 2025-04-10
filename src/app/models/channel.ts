export interface Channel {
    title: string;
    id: string;
    isPrivate?: boolean;
    allowedUsers?: string[];
    isDM?: boolean;
    creatorId: string;
}
