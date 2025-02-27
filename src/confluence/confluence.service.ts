import { Injectable } from '@nestjs/common';
import { ConfluencePagesLoader } from '@langchain/community/document_loaders/web/confluence';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { MongoVectorService } from '../mongo-vector/mongo-vector.service';

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
    const documents = await this.confluenceParser.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const allSplits = await splitter.splitDocuments(documents);
    await this.mongoVectorService.addDocuments(allSplits);

    return documents;
  };
}
