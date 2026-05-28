import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;

export const getDb = async (): Promise<Db> =>
{
	if(!client)
	{
		const uri = process.env.MONGODB_URI;
		if(!uri) throw new Error('MONGODB_URI is not set');
		client = new MongoClient(uri);
		await client.connect();
	}
	return client.db('courtly');
};
