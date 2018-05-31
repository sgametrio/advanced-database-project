let mongo = new Mongo()
let db = mongo.getDB("test")
let videos_c = db["youtube-videos-us"]
let videos_emb_c = db["youtube-videos-embedded-us"]
let categories_c = db["youtube-categories-us"]
let categories_emb_c = db["youtube-categories-embedded-us"]
let cursor

videos_emb_c.drop()
categories_emb_c.drop()
videos_c.aggregate([
    { 
        $lookup: { 
            from: "youtube-categories-us",
            localField: "category_id",
            foreignField: "_id",
            as:"category" 
        }
    },
    {
        $unwind: "$category"
    },
    {
        $out:"youtube-videos-embedded-us"
    }
])

/*
categories_c.aggregate([
    { 
        $lookup: { 
            from: "youtube-videos-us",
            localField: "_id",
            foreignField: "category_id",
            as:"videos" 
        }
    },
    {
        $project: {
            "videos._id": 1
        }
    },
    {
        $out:"youtube-categories-embedded-us"
    }
])
*/