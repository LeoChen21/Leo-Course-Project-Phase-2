export interface ContributorResponse {
    total: number;
    author: {
        login: string;
    }
}

export interface NpmApiResponse {
    repository: {
        url: string;
    };
}

export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
}

export interface LicenseInfo {
    key: string;
    name: string;
    spdxId: string;
    url: string;
}

export interface Readme {
    text: string;
}

export interface OpenIssueNode {
    createdAt: string;
    updatedAt: string;
    closedAt: string | null;
}

export interface ClosedIssueNode {
    createdAt: string;
    updatedAt: string;
    closedAt: string;
}

export interface OpenIssues {
    totalCount: number;
    nodes: OpenIssueNode[];
}

export interface ClosedIssues {
    totalCount: number;
    nodes: ClosedIssueNode[];
}

export interface PullRequestNode {
    createdAt: string;
    updatedAt: string;
    closedAt: string | null;
}

export interface PullRequests {
    totalCount: number;
    nodes?: PullRequestNode[];
}

export interface examplesFolder {
    entries: {
        name: string;
        type: string;
    }[];
}

export interface RepositoryResponse {
    licenseInfo: LicenseInfo;
    readme: Readme;
    openIssues: OpenIssues;
    closedIssues: ClosedIssues;
    pullRequests: PullRequests;
    isArchived: boolean;
    examplesFolder: examplesFolder;
}

export interface GraphQLResponse {
    data: {
        repository: RepositoryResponse;
    }
}

// metrics.ts
export interface Metrics {
    URL: string | null; // Added URL field to the Metrics class
    NetScore:  number | null;
    NetScore_Latency: number | null;
    RampUp: number | null;
    RampUp_Latency: number | null;
    Correctness: number | null;
    Correctness_Latency: number | null;
    BusFactor: number | null;
    BusFactor_Latency: number | null;
    ResponsiveMaintainer: number | null;
    ResponsiveMaintainer_Latency: number | null;
    License: number | null;
    License_Latency: number | null;
    PinnedDependencies: number | null;
    PinnedDependencies_Latency: number | null;
    ReviewedCode: number | null;
    ReviewedCode_Latency: number | null;
}

export interface WorkerResult {
    score: number;
    latency: number;
}