// Import categories by doing a remodeling from:
// categories: {
//     items: [
//         {
//             "id": "wewe"
//             ...
//         },
//          ...
//     ]
// }
// 
// to:

// [
//     {
//         "_id": "wewe"
//     },
//     ...
// ]

const mongodb = require("mongodb").MongoClient
const csv = require('csvtojson')
let Time = require('time-diff');
// Connection parameters
const url = "mongodb://localhost:27017";
const dbName = "test";

function importCategories(db) {
    const categories_dataset_file = "US_category_id.json"
    let categories_coll = db.collection("youtube-categories-us")
    categories_coll.drop().then((result) => {
        console.log("youtube-categories-us dropped")
    }).catch((error) => console.log("youtube-categories-us already dropped"))

    let time = new Time()
    time.start("import_categories")
    let categories_file = require(`../dataset/${categories_dataset_file}`)
    // Copy `id` field over `_id`
    for (let category of categories_file.items) {
        category._id = category.id
        delete category.id
    }
    return categories_coll.insertMany(categories_file.items).then((result) => {
        console.log(`Inserted ${result.insertedCount} categories: ${time.end("import_categories")}`)
    })
}

function importVideos(db) {
    let videos_coll = db.collection("youtube-videos-us")
    videos_coll.drop().then((result) => {
        console.log("youtube-videos-us dropped")
    }).catch((error) => console.log("youtube-videos-us already dropped"))
    let time = new Time()
    time.start("import_videos")
    const videos_dataset_file = "USvideos.csv"
    return csv()
        .fromFile(`dataset/${videos_dataset_file}`)
        .then((jsonObj) => {
            return videos_coll.insertMany(jsonObj).then((result) => {
                console.log(`Inserted ${result.insertedCount} categories: ${time.end("import_videos")}`)
            }).catch((error) => console.log(error))
        }).catch((error) => console.log(error))
}

// Use connect method to connect to the server
mongodb.connect(url, function (err, client) {
    if (err !== null) {
        return
    }
    console.log("Connected successfully to server")
    const db = client.db(dbName)
    importCollections = async (db) => {
        await importCategories(db)
        await importVideos(db)
    }

    runQueries = (db) => {
        // First 10 videos with more likes/dislikes

        // For each category, most viewed video

        // Videos with almost n comments

        // Categories, with less than n videos

        // Categories by number of videos
    }

    createIndexes = (db) => {
        // comments
        
        // views

        // likes,dislikes
    }
    
    importCollections(db).then((response) => {

        client.close()
    })
    
});