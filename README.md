### Getting Started

Fill the `.env` file with the following content:

```
# LLM Provider configuration
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
DEFAULT_PROVIDER=openai  # or 'anthropic' to use Claude by default

# LangSmith configuration
LANGSMITH_TRACING=
LANGSMITH_ENDPOINT=
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=

# Confluence configuration
CONFLUENCE_USERNAME=
CONFLUENCE_ACCESS_TOKEN=
CONFLUENCE_BASE_URL=
CONFLUENCE_SPACE_KEY=

# MongoDB configuration
MONGODB_ATLAS_URI=
MONGODB_ATLAS_DB_NAME=
MONGODB_ATLAS_COLLECTION_NAME=

# Google Chat configuration
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
```

`npm i`  
`npm run start:dev`  

### Documentation AI Augmentation:

1. ChatGPT
2. DeepSeek
3. Claude

### Implementation steps:

Step 1:

1. Use LangChain
2. Figure out DB structure and how to store their docs (?)
3. Connector to confluence

Step 2:

1. Memory? LangGraph to handle memory?

### LLM Provider Options

The application supports two LLM providers:
1. **OpenAI** (default) - Uses GPT-4o model for text generation
2. **Anthropic** - Uses Claude 3.5 Sonnet model for text generation

You can select which provider to use in several ways:

1. **Default Provider** - Set the `DEFAULT_PROVIDER` environment variable to `anthropic` or `openai`
2. **API Endpoint Selection** - Add the `provider` parameter to API requests:
   - `GET /lang-graph/confluence-docs?question=YOUR_QUESTION&provider=anthropic`
   - `POST /lang-graph/process` with body: `{ "taskType": "answer_question", "inputText": "YOUR_TEXT", "provider": "openai" }`
3. **Provider API** - Use the provider management endpoints:
   - `GET /lang-graph/provider` - Get the current provider
   - `POST /lang-graph/provider/anthropic` - Switch to Anthropic
   - `POST /lang-graph/provider/openai` - Switch to OpenAI

Make sure to provide both `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` in your environment variables to use both providers.

### LangGraph
[LangGraph deployment](https://langchain-ai.github.io/langgraphjs/tutorials/deployment/)  


```
$ npx @langchain/langgraph-cli@latest
# Or install globally, will be available as `langgraphjs`
$ npm install -g @langchain/langgraph-cli
```

### JupyterLab

`brew install jupyterlab`

[//]: # (To start jupyterlab now and restart at login:)
[//]: # (brew services start jupyterlab)
[//]: # (Or, if you don't want/need a background service you can just run:)
[//]: # (/opt/homebrew/opt/jupyterlab/bin/jupyter-lab)

### Command used
`open -a intellij\ idea .`  
`rm -rf`  
`nest new .`  
`ga .`  
`gcmsg "chore(nestjs): add basic nestjs configuration"`  
`ls -la`
`gp`  
`git log`   
`git init`  
`gst`  
`nest g resource LangChain`  
`node -v`  
`npm install -g @langchain/langgraph-cli`  
`npm i @langchain/core @langchain/langgraph uuid`
`brew install jupyterlab`  
`brew services start jupyterlab`
`npm i @langchain/core @langchain/langgraph uuid`  
`npm i @langchain/openai`
`npm i @nestjs/config`  
`npm run start:dev`  
`nest g service OpenAI`
`npm install @langchain/community @langchain/core html-to-text`  
`curl "localhost:3000/lang-chain/open-ai?content=WhatIsMyName?"`
`curl "localhost:3000/lang-chain/open-ai?content=DoYouStillKnowMyName?"`
`nest g module confluence`  
`nest g service confluence`  
`npm run start:dev`  
`curl "localhost:3000/lang-chain/confluence-docs"`  
`brew install mongodb-community@8.0`  
`brew tap mongodb/brew`  
`brew update`  
`brew install mongodb-community@5.0`  
`brew services start mongodb/brew/mongodb-community@5.0`  
`npm i mongodb`  
`npm i @langchain/mongodb`  
`nest g service mongo-vector`  
`nest g module mongo-vector`  

