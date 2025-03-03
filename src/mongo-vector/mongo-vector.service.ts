import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { Collection, MongoClient } from 'mongodb';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';

@Injectable()
export class MongoVectorService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient;
  private collection: Collection;
  private vectorStore: MongoDBAtlasVectorSearch;
  private readonly embeddings: OpenAIEmbeddings;
  private readonly MONGODB_ATLAS_URI = process.env.MONGODB_ATLAS_URI;
  private readonly MONGODB_ATLAS_DB_NAME = process.env.MONGODB_ATLAS_DB_NAME;
  private readonly MONGODB_ATLAS_COLLECTION_NAME =
    process.env.MONGODB_ATLAS_COLLECTION_NAME;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      model: 'text-embedding-3-large',
    });
  }
  onModuleInit = async () => {
    this.client = new MongoClient(process.env.MONGODB_ATLAS_URI);
    await this.client.connect();
    this.collection = this.client
      .db(this.MONGODB_ATLAS_DB_NAME)
      .collection(this.MONGODB_ATLAS_COLLECTION_NAME);

    this.vectorStore = new MongoDBAtlasVectorSearch(this.embeddings, {
      collection: this.collection,
      indexName: 'vector_index',
      textKey: 'pageContent',
      embeddingKey: 'embedding',
    });
  };
  addDocuments = async (documents: any[]) => {
    // If we have documents to add
    if (documents.length > 0) {
      try {
        // Clear existing documents if any exist
        await this.clearDocuments();
        
        // Add the new documents
        await this.vectorStore.addDocuments(documents);
      } catch (error) {
        console.error('Error adding documents to MongoDB:', error);
        throw error;
      }
    }
  };
  
  clearDocuments = async () => {
    try {
      // Delete all documents in the collection
      await this.collection.deleteMany({});
    } catch (error) {
      console.error('Error clearing documents from MongoDB:', error);
      throw error;
    }
  };

  similaritySearch = async (text: string) => {
    return this.vectorStore.similaritySearch(text);
  };

  onModuleDestroy = async () => {
    await this.client.close();
  };
}
