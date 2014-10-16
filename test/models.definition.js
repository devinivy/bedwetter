module.exports = [
    {
        identity: 'treat',
        connection: 'testing',
        
        attributes: {
            name: 'string',
            calories: 'integer',
            owner: {
                collection: 'zoo',
                via: 'treats'
            }
        }
    },
    {
        identity: 'zoo',
        connection: 'testing',
        
        attributes: {
            name: 'string',
            treats: {
                collection: 'treat',
                via: 'owner',
                dominant: true
            }
        }
    }
];