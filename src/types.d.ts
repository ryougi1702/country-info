export type WikipediaSummaryResponse = {
    title: string;
    extract: string;
    extract_html: string;
    thumbnail?: {
        source: string;
        width: number;
        height: number;
    };
    originalimage?: {
        source: string;
        width: number;
        height: number;
    };
    content_urls: {
        desktop: {
            page: string;
            revisions: string;
            edit: string;
            talk: string;
        };
        mobile: {
            page: string;
            revisions: string;
            edit: string;
            talk: string;
        };
    };
};
type Category = {
    ns: number;
    title: string;
};
type Link = {
    ns: number;
    title: string;
};
export type WikipediaParseResponse = {
    parse: {
        title: string;
        pageid: number;
        text: {
            "*": string;
        };
        categories?: Category[];
        links?: Link[];
    };
};
export {};
//# sourceMappingURL=types.d.ts.map