var elasticsearch = require('elasticsearch');

var elasticClient = new elasticsearch.Client();

function deleteIndex(indexName) {
    return elasticClient.indices.delete({
        index: indexName
    });
}
exports.deleteIndex = deleteIndex;

function initIndex(indexName) {
    return elasticClient.indices.create({
        index: indexName
    });
}
exports.initIndex = initIndex;

function indexExists(indexName) {
    return elasticClient.indices.exists({
        index: indexName
    });
}
exports.indexExists = indexExists;

function initMapping(indexName) {
    return elasticClient.indices.putMapping({
        index: indexName,
        type: "something",
        body: {
            properties: {
                title: { type: "string" },
                suggest: {
                    type: "completion",
                    analyzer: "standard",
                    search_analyzer: "standard",
                    payloads: true
                }
            }
        }
    });
}
exports.initMapping = initMapping;

function initialize(indexName){
    return indexExists(indexName).then(function (exists) {
        if (exists) {
            return deleteIndex(indexName);
        }
    }).then(function () {
        return initIndex(indexName)
    }).then(function(){
        return initMapping(indexName)
    })
}
exports.initialize = initialize;

function add(indexName, title, post) {
    return elasticClient.index({
        index: indexName,
        type: "something",
        body: {
            title: title,
            suggest: {
                input: title.split(" "),
                output: post
            }
        }
    });
}
exports.add = add;

function getSuggestions(indexName, input) {
    return elasticClient.suggest({
        index: indexName,
        type: "something",
        body: {
            docsuggest: {
                text: input,
                completion: {
                    field: "suggest",
                    fuzzy: true
                }
            }
        }
    })
}
exports.getSuggestions = getSuggestions;