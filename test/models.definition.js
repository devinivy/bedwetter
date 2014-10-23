module.exports = [
    {
        identity: 'treat',
        connection: 'testing',
        schema: true,
        
        attributes: {
            name: 'string',
            calories: 'integer',
            place: {
                collection: 'zoo',
                via: 'treats'
            },
            animalOwner: {
                model: 'animals'
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
                via: 'place',
                dominant: true
            }
        }
    },
    {
        identity: 'animals', // (users)
        connection: 'testing',
        schema: true,
        
        attributes: {
            species: 'string',
            treats: {
                collection: 'treat',
                via: 'animalOwner'
            }
        }
    }
];