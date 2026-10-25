export interface CustomViewSummary {
  slug: string;
  /** whether the view is listed in the navigation menu, views start hidden */
  displayInNav: boolean;
}

export interface CustomViewsListResponse {
  views: CustomViewSummary[];
}
