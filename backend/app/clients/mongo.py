import os
from pymongo import MongoClient
from pymongo.database import Database

_client: MongoClient | None = None


def get_db() -> Database:
	global _client
	if _client is None:
		uri = os.getenv("MONGODB_URI")
		if not uri:
			raise RuntimeError("MONGODB_URI is not set.")
		_client = MongoClient(uri)
	return _client["courtly"]
