module.exports = [
    {
        identity: 'treat',
        connection: 'testing',
        schema: true,
        
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
        schema: true,
        
        attributes: {
            name: 'string',
            treats: {
                collection: 'treat',
                via: 'owner',
                dominant: true
            }
        }
    },
    {
        identity: 'animals', // (users)
        connection: 'testing',
        schema: true,
        
        attributes: {
            type: 'string'
        }
    }
];