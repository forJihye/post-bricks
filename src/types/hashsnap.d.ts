
type HashsnapPostParams = Partial<{
  "page": number;
  "limit": number;
  "featured": 0 | 1;
  "digital_rights_obtained": 0 | 1 | "all";
  "deleted": 0 | 1;
  "blacklisted": 0 | 1;
  "pinned": 0| 1| 'all';
  "pinned_on_top": 0 | 1;
  "types": 'image' | 'video' | "text" | "image,video,text";
  "resolvers": "facebook" | "instagram" | "twitter" | "tiktok" | "vkontakte" | "moderation" | "qr" | "upload" | "all";
  "usernames": string;
  "user_ids": number;
  "max_age_days": string;
  "max_age_hours": string;
  "max_age_minutes": string;
  "max_age_seconds": string;
  "min_created_date": string;
  "max_created_date": string;
  "min_featured_date": string;
  "max_featured_date": string;
  "min_deleted_date": string;
  "max_deleted_date": string;
  "before_post": number;
  "after_post": number;
  "order_by": "date" | "id" | "featured_date" | "deleted_date" | "reach" | "votes" | "likes" | "comments";
  "order": "asc" | "desc";
  "tags": string;
  "search": string;
  "screen_numbers": '1' | '2' | '3' | '4' | "1,2,3,4";
  "products": [];
}>

interface HashsnapPostItem {
  "id": number;
  "project_id": number;
  "type": string;
  "custom_id": string;
  "internal_id": string;
  "media_index": number;
  "resolver": string;
  "thumbnail": string;
  "thumbnail_width": number;
  "thumbnail_height": number;
  "url": string;
  "url_width": number;
  "url_height": number;
  "link": string;
  "caption": string;
  "ts": string;
  "created_date": string;
  "created_date_posix": number;
  "updated_date": string;
  "featured_date": null,
  "deleted_date": null,
  "deleted": false,
  "blacklisted": false,
  "repost": false,
  "featured": false,
  "language": string;
  "pinned": false,
  "broken": false,
  "volatile": false,
  "printed": 1,
  "tags": string;
  "obtain_digital_rights": false,
  "digital_rights_comment_added": false,
  "digital_rights_obtained": false,
  "username": string;
  "user_display_name": string;
  "user_profile_picture": string;
  "user_id": string;
  "user_full_name": string;
  "user_followers": number;
  "votes": null,
  "reach": null,
  "likes": number;
  "comments": number;
  "retweets": number;
  "favourites": null,
  "location": string;
  "latitude": number;
  "longitude": number;
  "random_screen_number": number;
  "products": any[];
}

interface HashsnapProjectStats {
  "id": number;
  "posts_count": number;
  "deleted_posts_count": number;
  "blacklisted_posts_count": number;
  "featured_posts_count": number;
  "volatile_posts_count": number;
  "latest_post_date": string;
  "image_posts_count": number;
  "text_posts_count": number;
  "video_posts_count": number;
  "instagram_posts_count": number;
  "twitter_posts_count": number;
  "tiktok_posts_count": number;
  "vkontakte_posts_count": number;
  "facebook_posts_count": number;
  "upload_posts_count": number;
  "active_posts_count": number;
  "active_video_posts_count": number;
  "active_image_posts_count": number;
  "active_text_posts_count": number;
  "featured_video_posts_count": number;
  "featured_image_posts_count": number;
  "featured_text_posts_count": number;
}

interface HashsnapPost {
  "status": number;
  "count": number;
  "page": number;
  "next": string;
  "previous": null|number;
  "items": HashsnapPostItem[];
  "project_stats": HashsnapProjectStats;
}