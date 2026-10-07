export interface ChangelogItem {
    icon: string;
    title: string;
    summary: string;
}

export interface ChangelogRelease {
    id: string;
    date: string;
    title: string;
    items: ChangelogItem[];
}
