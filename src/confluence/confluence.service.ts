import { Injectable } from '@nestjs/common';
import { ConfluencePagesLoader } from '@langchain/community/document_loaders/web/confluence';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { MongoVectorService } from '../mongo-vector/mongo-vector.service';
import { Document } from '@langchain/core/documents';

@Injectable()
export class ConfluenceService {
  private readonly username = process.env.CONFLUENCE_USERNAME;
  private readonly accessToken = process.env.CONFLUENCE_ACCESS_TOKEN;
  private readonly baseURL = process.env.CONFLUENCE_BASE_URL;
  private readonly spaceKey = process.env.CONFLUENCE_SPACE_KEY;
  public readonly confluenceParser: ConfluencePagesLoader;

  constructor(private readonly mongoVectorService: MongoVectorService) {
    if (this.username && this.accessToken) {
      this.confluenceParser = new ConfluencePagesLoader({
        baseUrl: this.baseURL,
        spaceKey: this.spaceKey,
        username: this.username,
        accessToken: this.accessToken,
      });
    }
  }

  loadConfluenceDocuments = async () => {
    // Load all documents from Confluence
    const documents = await this.confluenceParser.load();
    
    // Deduplicate documents based on source URL
    const dedupedDocuments = this.deduplicateDocuments(documents);
    
    // Split documents into chunks for vector storage
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const allSplits = await splitter.splitDocuments(dedupedDocuments);
    
    // Store the deduplicated and split documents
    await this.mongoVectorService.addDocuments(allSplits);

    return dedupedDocuments;
  };
  
  private deduplicateDocuments(documents: any[]): any[] {
    // Create a map to track unique documents by their source URL
    const uniqueDocsByUrl = new Map<string, any>();
    
    for (const doc of documents) {
      const sourceUrl = doc.metadata?.source || '';
      
      // If we have a source URL and haven't seen it before, add to our map
      if (sourceUrl && !uniqueDocsByUrl.has(sourceUrl)) {
        uniqueDocsByUrl.set(sourceUrl, doc);
      }
    }
    
    // Convert map values back to array
    return Array.from(uniqueDocsByUrl.values());
  }
}
