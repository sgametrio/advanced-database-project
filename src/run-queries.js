let mongo = new Mongo()
let db = mongo.getDB("test")
let videos_c = db["youtube-videos-us"]
let videos_emb_c = db["youtube-videos-embedded-us"]
let categories_emb_c = db["youtube-categories-embedded-us"]
let categories_c = db["youtube-categories-us"]

function printC(cursor) {
    while (cursor.hasNext()) {
        printjson(cursor.next())
    }
}

let cursor
print("10 Most viewed videos:")
cursor = videos_c.find({}).sort({ views: -1 }).limit(10)
printC(cursor)

// For each category, views of most viewed video
print("For each category, most viewed video (embedded):")
cursor = videos_emb_c.aggregate([
    {
        $sort: { "views": -1 }
    },
    {
        $group: {
            "_id": { "category": "$category.title" },
            "most_viewed_video": { $first: "$$ROOT" }
        }
    },
    {
        $project: {
            "_id": 0,
            "category" : "$_id.category",
            "most_viewed_video": {
                "title": 1,
                "views": 1
            }
        }
    }
])
printC(cursor)
//printC(cursor)

print("For each category, most viewed video (reference):")
cursor = categories_c.aggregate([
    {
        $lookup: { 
            from: "youtube-videos-us",
            localField: "_id",
            foreignField: "category_id",
            as:"videos" 
        }
    },
    {
        $unwind: "$videos"
    },
    {
        $sort: {"videos.views": -1}
    },
    {
        $group: {
            "_id": "$_id",
            "most_viewed_video": { $first: "$videos"}
        }
    },
    {
        $project: {
            "_id": 0,
            "category" : "$_id",
            "most_viewed_video": {
                "views": 1,
                "title": 1
            }
        }
    }
])
printC(cursor)

// Videos with almost n comments
/*cursor = videos_c.find({comment_count: {$gt: 1000}}, {
    _id: 0,
    title: 1,
    comment_count: 1
}).sort({comment_count: 1}).limit(10)*/
//printC(cursor)

// Categories, with less than n videos
print("Categories with videos avg comments > 10000 (emb): ")
cursor = videos_emb_c.aggregate([
    {
        $group: {
            "_id": "$category.title",
            "avg_comments": { $avg: "$comment_count" }
        }
    },
    {
        $match: {
            "avg_comments": { $gt: 10000 }
        }
    }
])
printC(cursor)

print("Categories with videos avg comments > 10000 (ref):")
cursor = categories_c.aggregate([
    {
        $lookup: { 
            from: "youtube-videos-us",
            localField: "_id",
            foreignField: "category_id",
            as:"videos" 
        }
    },
    {
        $unwind: "$videos"
    },
    {
        $group: {
            "_id": "$title",
            "avg_comments": { $avg: "$videos.comment_count"}
        }
    },
    {
        $match: {
            "avg_comments": { $gt: 10000 }
        }
    },
    {
        $project: {
            "_id": 0,
            "category" : "$_id",
            "avg_comments": 1
        }
    }
])
printC(cursor)

print("Most tagged videos day by day and by category (emb): ")
cursor = videos_emb_c.aggregate([
    {
        $project: {
            "category": 1,
            "trending_date": 1,
            "title": 1,
            "tags_count": { $size: { "$ifNull": [ "$tags", [] ] }}
        }
    },
    {
        $sort: { "tags_count": -1}
    },
    {
        $group: {
            "_id": { category: "$category.title", date: "$trending_date" },
            "most_tagged_video": { $first: "$$ROOT" }
        }
    },
    {
        $project: {
            "_id": 0,
            "category": "$_id.category",
            "date": "$_id.date",
            "most_tagged_video": {
                "title": 1,
                "tags_count": 1
            }
        }
    },
    {
        $sort: {
            "date": -1
        }
    },
    {
        $limit: 10
    }
])
printC(cursor)

print("Most tagged videos day by day and by category (ref): ")
cursor = categories_c.aggregate([
    {
        $lookup: { 
            from: "youtube-videos-us",
            localField: "_id",
            foreignField: "category_id",
            as:"videos" 
        }
    },
    {
        $unwind: "$videos"
    },
    {
        $project: {
            "title": 1,
            "videos": {
                "trending_date": 1,
                "title": 1,
                "tags_count": { $size: { "$ifNull": [ "$videos.tags", [] ] }}
            }
        }
    },
    {
        $sort: { "videos.tags_count": -1 }
    },
    {
        $group: {
            "_id": { category: "$title", date: "$videos.trending_date" },
            "most_tagged_video": { $first: "$videos" }
        }
    },
    {
        $limit: 10
    }
])
printC(cursor)

// Categories by number of videos
print("Categories with less than 5000 videos (ascending) (emb): ")
cursor = videos_emb_c.aggregate([
    {
        $group: {
            "_id": "$category.title",
            "videos_count": { $sum: 1 }
        }
    },
    {
        $match: {
            "videos_count": { $lt: 5000 }
        }
    },
    {
        $sort: {
            "videos_count": 1
        }
    }
])
printC(cursor)

print("Categories with less than 5000 videos (ascending) (ref): ")
cursor = categories_c.aggregate([
    {
        $lookup: { 
            from: "youtube-videos-us",
            localField: "_id",
            foreignField: "category_id",
            as:"videos" 
        }
    },
    {
        $unwind: "$videos"
    },
    {
        $group: {
            "_id": "$title",
            "videos_count": { $sum: 1 }
        }
    },
    {
        $match: {
            "videos_count": { $lt: 5000 }
        }
    },
    {
        $sort: {
            "videos_count": 1
        }
    }
])
printC(cursor)
