---
title: a
mathjax: true
published: false
abbrlink: e8b7be43
date: 2025-04-29 00:00:00
tags:
cover:
categories:
---





# **Spring Boot 环境下 Spring AI 与 LangChain4j 对比分析报告**


## **I. 引言**


### **A. Java/Spring Boot 中 LLM 集成的兴起**

近年来，将大型语言模型 (LLM) 集成到企业级 Java 应用中已成为一股显著的技术趋势，尤其是在广泛使用的 Spring Boot 生态系统中。传统上由 Python 主导的人工智能开发领域，正逐渐看到 Java 解决方案的兴起和普及 <sup>1</sup>。这种转变反映了在现有 Java 技术栈中利用 LLM 能力的强烈需求，推动了 Java AI 框架的发展。


### **B. 框架介绍：Spring AI 与 LangChain4j**

本次报告旨在对比分析两个在 Spring Boot 环境下备受关注的 Java LLM 框架：Spring AI 和 LangChain4j。



* **Spring AI**：作为 Spring 生态系统的一部分，Spring AI 旨在将 Spring 的核心设计原则（如可移植性、模块化设计、POJO 作为构建块）应用于 AI 工程领域 <sup>4</sup>。它致力于提供与 Spring Boot 的无缝集成体验，利用自动配置和启动器简化开发流程 <sup>1</sup>。尽管受到 Python LangChain 和 LlamaIndex 等项目的启发，Spring AI 并非直接移植，而是专注于提供 Java 优先的解决方案 <sup>5</sup>。
* **LangChain4j**：该框架旨在成为 Python LangChain 在 Java 领域的对应物，目标是简化基于 LLM 的 Java 应用开发 <sup>2</sup>。LangChain4j 的核心理念之一是提供跨不同 LLM 提供商和向量存储的统一 API，从而避免供应商锁定，提高代码的可移植性 <sup>2</sup>。

这两个框架都力求降低在 Java 应用中集成 AI 功能的复杂性 <sup>1</sup>。


### **C. 报告目标与结构**

本报告的核心目标是在 Spring Boot 环境下，从六个关键技术维度对 Spring AI 和 LangChain4j 进行详细的技术比较。这六个维度包括：基本配置（以 OpenAI 为例）、多轮聊天（含聊天内存）、流式输出与普通输出、聊天持久化（以 MySQL 为概念示例）、多模态聊天以及检索增强生成（RAG）。

评估将围绕三个核心标准进行：**简洁性 (Conciseness)**、**优雅性 (Elegance)** 和 **易用性 (Ease of Use)**。报告结构安排如下：首先概述两个框架的核心理念与关键特性，然后逐一对比分析它们在上述六个维度的表现，包括提供相应的 Spring Boot 代码示例，接着进行整体评估并给出建议，最后总结报告内容。


## **II. 框架概述**


### **A. Spring AI**


#### **1. 核心理念**

Spring AI 的核心目标是将成熟的 Spring 设计原则应用于 AI 工程领域 <sup>4</sup>。它强调可移植性，旨在通过提供统一的 API 来支持不同的 AI 模型和向量数据库，使得开发者可以在不同服务提供商之间切换而无需大规模重写代码 <sup>4</sup>。模块化设计使得开发者可以根据需要选择和组合不同的功能组件。同时，它推崇使用简单的 Java 对象 (POJO) 作为应用程序的基本构建块，降低复杂性 <sup>4</sup>。Spring AI 的设计哲学是深度融入 Spring 生态，为 Spring 开发者提供熟悉且一致的开发体验 <sup>1</sup>。虽然借鉴了 Python 社区的 LangChain 和 LlamaIndex 项目，但 Spring AI 坚持以 Java 为中心，满足 Java 生态系统的特定需求 <sup>5</sup>。


#### **2. 关键抽象**

Spring AI 提供了一系列核心抽象接口来简化与 AI 模型的交互：



* **ChatClient**: 这是与聊天模型交互的核心接口，其设计采用了流畅（Fluent）API 风格，类似于 Spring 中广受欢迎的 WebClient 和 RestClient，旨在降低熟悉 Spring 的开发者的学习曲线 <sup>4</sup>。它支持同步和异步（流式）调用。
* **EmbeddingClient**: 用于将文本转换为向量表示（Embeddings），这是许多 AI 应用（如 RAG、语义搜索）的基础 <sup>4</sup>。该接口同样注重可移植性，允许切换不同的 Embedding 模型提供商 <sup>11</sup>。
* **VectorStore**: 提供与向量数据库交互的统一 API，支持包括元数据过滤在内的多种查询操作，并支持众多主流向量数据库 <sup>4</sup>。其新颖的类 SQL 元数据过滤 API 是一个显著特点 <sup>4</sup>。
* **Advisors**: 用于封装常见的生成式 AI 模式，转换与 LLM 交互的数据，并提供跨模型和用例的可移植性 <sup>4</sup>。
* **DocumentReader, DocumentTransformer**: 用于 RAG 中的 ETL 流程，负责读取、转换和处理文档数据 <sup>6</sup>。

此外，Spring AI 支持多种模型类型，包括聊天补全、文本嵌入、文本生成图像、音频转录、文本转语音和内容审核 <sup>4</sup>。对于更高级的用例，Spring AI 也在探索 Agentic Patterns <sup>13</sup> 和模型上下文协议 (MCP) <sup>14</sup> 等概念。


#### **3. Spring Boot 集成**

Spring AI 与 Spring Boot 的集成是其核心优势之一。它通过提供专门的 Spring Boot 启动器（Starters）来实现，例如 spring-ai-openai-spring-boot-starter <sup>1</sup>。开发者只需添加相应的依赖，并在 application.properties 或 application.yml 文件中配置必要的属性（如 API 密钥、模型名称、基础 URL 等），即可利用 Spring Boot 的自动配置功能快速启用 AI 功能 <sup>1</sup>。这种方式符合 Spring Boot 的惯例，简化了项目的初始设置和配置管理。虽然自动配置极大地方便了开发者，但在需要更复杂配置（例如同时使用多个模型提供商）时，可能需要了解如何覆盖或禁用部分自动配置 <sup>16</sup>。


#### **4. 成熟度与资源**

Spring AI 项目发展迅速。虽然早期的资料提到其处于里程碑（Milestone）版本 <sup>1</sup>，但根据其持续的更新和社区活跃度，它正朝着或已经达到通用可用性（GA）阶段。开发者可以访问官方参考文档 <sup>4</sup>、API 文档 <sup>17</sup>、官方示例仓库 <sup>12</sup> 获取详细信息和代码示例。社区资源也日益丰富，例如 "Awesome Spring AI" <sup>5</sup> 收集了大量的教程、工具和项目。官方 GitHub 仓库的 Discussions 板块 <sup>19</sup> 也为开发者提供了交流和寻求帮助的平台。


### **B. LangChain4j**


#### **1. 核心理念**

LangChain4j 的核心目标是成为 Java 领域内功能全面的 LLM 集成框架，旨在简化利用 LLM 构建 Java 应用的过程，其灵感来源于 Python 社区的 LangChain 项目 <sup>2</sup>。它特别强调提供统一的 API 来抽象底层 LLM 提供商（如 OpenAI, Google Vertex AI）和向量存储（如 Pinecone, Milvus）的具体实现细节 <sup>9</sup>。这种设计使得开发者能够轻松地在不同的服务之间进行切换和实验，而无需修改核心业务逻辑，从而有效避免了供应商锁定，并提高了应用的可维护性和灵活性 <sup>2</sup>。


#### **2. 关键抽象**

LangChain4j 提供了一个丰富的工具箱和多层次的抽象：



* **低层抽象**: 包括 ChatLanguageModel <sup>20</sup>（用于聊天交互）、EmbeddingModel <sup>20</sup>（用于生成向量嵌入）、EmbeddingStore <sup>10</sup>（用于存储和检索向量）等核心接口。这些是构建 LLM 应用的基础构件，提供了最大的灵活性和控制力 <sup>10</sup>。
* **高层抽象**: 最具代表性的是 **AiServices** <sup>10</sup>。这是一种声明式 API，开发者只需定义一个 Java 接口，LangChain4j 就能自动生成实现该接口的代理对象，处理与 LLM 的交互、参数转换、内存管理等复杂细节。这种模式类似于 Spring Data JPA 或 Retrofit，极大地简化了代码，让开发者更专注于业务逻辑 <sup>22</sup>。
* **其他组件**: 还包括用于提示词工程（Prompt Templating）、聊天内存管理（Chat Memory）、工具/函数调用（Tool Calling/Function Calling）、文档加载与分割、RAG 流程等全面的工具和实现 <sup>8</sup>。

LangChain4j 支持超过 15 种 LLM 提供商和超过 20 种 Embedding 存储 <sup>9</sup>。


#### **3. Spring Boot 集成**

LangChain4j 提供了官方的 Spring Boot 集成支持。最初可能存在一些社区维护的集成项目 <sup>20</sup>，但这些已被官方的 langchain4j-spring 项目所取代 <sup>20</sup>。这表明 LangChain4j 对 Spring 生态系统的支持已经成熟并得到了官方的维护和发展。开发者可以通过添加 langchain4j-spring-boot-starter（或组合使用 langchain4j-spring 和具体模型/存储的依赖，如 langchain4j-open-ai <sup>23</sup>）来集成。配置同样通过标准的 application.properties 或 application.yml 文件进行，使用 langchain4j. 前缀的属性键 <sup>20</sup>。推荐使用 LangChain4j 提供的 BOM (Bill of Materials) 来统一管理相关依赖的版本 <sup>24</sup>。官方集成确保了 LangChain4j 的核心功能更新能及时反映在 Spring Boot 支持中。


#### **4. 成熟度与资源**

LangChain4j 是一个自 2023 年初以来一直活跃开发的项目 <sup>8</sup>。版本迭代较快，从早期版本（如 0.25.0 <sup>2</sup>）发展到更新的 Beta 或 GA 版本（如 1.0.0-beta3 <sup>24</sup>）。官方文档 <sup>8</sup> 内容详尽，提供了入门指南、教程和集成细节。官方维护了专门的示例代码库 langchain4j-examples <sup>9</sup>，展示了各种用例的实现。此外，还有社区维护的集成 (langchain4j-community) 和资源列表 (awesome-langchain4j) <sup>23</sup>。开发者可以通过 GitHub Discussions 或 Discord 社区获取帮助 <sup>9</sup>。


## **III. 多维度对比分析**

本章节将围绕用户指定的六个维度，对 Spring AI 和 LangChain4j 在 Spring Boot 环境下的表现进行详细对比，重点评估其简洁性、优雅性和易用性，并提供相应的代码示例。


### **A. 基本配置 (以 OpenAI 为例)**


#### **1. Spring AI**



* **设置**:
    * 依赖：在 pom.xml (Maven) 或 build.gradle (Gradle) 中添加 spring-ai-openai-spring-boot-starter 依赖 <sup>4</sup>。
    * 配置：在 application.properties 中配置必要属性，主要是 OpenAI API 密钥 (spring.ai.openai.api-key) 和可选的模型名称 (spring.ai.openai.chat.options.model)、基础 URL (spring.ai.openai.base-url，可用于连接兼容 OpenAI API 的服务，如 NVIDIA <sup>15</sup>) 等 <sup>4</sup>。
* **代码示例**: 通过依赖注入获取 ChatClient 实例（通常通过 ChatClient.Builder 构建 <sup>4</sup>），然后在 Spring 组件（如 @Service 或 @RestController）中使用。 \
Java \
import org.springframework.ai.chat.client.ChatClient; \
import org.springframework.web.bind.annotation.GetMapping; \
import org.springframework.web.bind.annotation.RequestParam; \
import org.springframework.web.bind.annotation.RestController; \
 \
@RestController \
public class BasicChatController { \
 \
    private final ChatClient chatClient; \
 \
    // Use constructor injection for ChatClient.Builder \
    public BasicChatController(ChatClient.Builder chatClientBuilder) { \
        this.chatClient = chatClientBuilder.build(); \
    } \
 \
    @GetMapping("/ai/basic/chat") \
    public String chat(@RequestParam(defaultValue = "Tell me a joke") String message) { \
        // Simple call using the injected ChatClient \
        return chatClient.prompt() \
                        .user(message) \
                        .call() \
                        .content(); // Extract content as String \
    } \
} \
上述代码展示了在 @RestController 中注入 ChatClient 并进行一次简单的调用 <sup>4</sup>。
* **分析**: Spring AI 充分利用了 Spring Boot 的自动配置机制，配置过程符合 Spring 开发者的习惯。ChatClient 的流畅 API 设计与 WebClient、RestClient 等 Spring 常用客户端保持一致 <sup>4</sup>，降低了学习成本。整体设置简洁明了。


#### **2. LangChain4j**



* **设置**:
    * 依赖：添加 langchain4j-openai-spring-boot-starter 依赖，或通过 langchain4j-spring 结合 langchain4j-open-ai <sup>20</sup>。建议使用 LangChain4j BOM 管理版本 <sup>24</sup>。
    * 配置：在 application.properties 中配置 langchain4j.open-ai.chat-model.api-key, langchain4j.open-ai.chat-model.model-name 等属性 <sup>20</sup>。LangChain4j 还提供了使用演示密钥和代理进行测试的选项 <sup>24</sup>。
* **代码示例 (使用 ChatLanguageModel)**: 注入 ChatLanguageModel 接口，并调用其 generate 方法。 \
Java \
import dev.langchain4j.model.chat.ChatLanguageModel; \
import org.springframework.web.bind.annotation.GetMapping; \
import org.springframework.web.bind.annotation.RequestParam; \
import org.springframework.web.bind.annotation.RestController; \
 \
@RestController \
public class BasicLangChainController { \
 \
    private final ChatLanguageModel chatLanguageModel; \
 \
    // Constructor injection \
    public BasicLangChainController(ChatLanguageModel chatLanguageModel) { \
        this.chatLanguageModel = chatLanguageModel; \
    } \
 \
    @GetMapping("/ai/langchain4j/chat") \
    public String chat(@RequestParam(defaultValue = "Tell me a joke") String message) { \
        // Direct generation using ChatLanguageModel \
        return chatLanguageModel.generate(message); \
    } \
} \
上述代码展示了注入 ChatLanguageModel 并直接生成响应 <sup>20</sup>。
* **代码示例 (使用 AiServices)**: 定义一个接口，使用 AiServices 创建实现。 \
Java \
import dev.langchain4j.service.SystemMessage; \
import dev.langchain4j.service.UserMessage; \
import dev.langchain4j.service.spring.AiService; // Import the Spring specific annotation \
 \
// Define the AI Service interface \
@AiService // Use the Spring specific annotation for auto-configuration \
public interface BasicAssistant { \
    String chat(@UserMessage String message); \
} \
 \
// In your RestController or Service: \
// @RestController \
// public class BasicAiServiceController { \
//     private final BasicAssistant assistant; \
// \
//     public BasicAiServiceController(BasicAssistant assistant) { \
//         this.assistant = assistant; \
//     } \
// \
//     @GetMapping("/ai/langchain4j/aiservice/chat") \
//     public String chat(@RequestParam(defaultValue = "Tell me a joke") String message) { \
//         return assistant.chat(message); \
//     } \
// } \
AiServices 提供了一种更高级、声明式的方式来定义交互 <sup>22</sup>。
* **分析**: LangChain4j 同样受益于其 Spring Boot 启动器提供的自动配置。配置属性遵循 langchain4j. 命名空间。直接使用 ChatLanguageModel.generate() 非常直接。而 AiServices 提供了一种独特的、高度抽象的交互方式，将 LLM 调用封装在接口方法后面 <sup>10</sup>。


#### **3. 评估与比较**



* **简洁性**: 对于最基础的单次调用，两者都相当简洁。LangChain4j 的 chatLanguageModel.generate(message) 可能比 Spring AI 的 chatClient.prompt().user(message).call().content() 看起来略微直接。然而，LangChain4j 的 AiServices 在定义交互逻辑方面可以做到非常简洁。
* **优雅性**: Spring AI 的 ChatClient 设计与 Spring 生态的其他部分（如 WebClient）保持一致，对于熟悉 Spring 的开发者而言感觉更“原生”和优雅 <sup>4</sup>。LangChain4j 的 AiServices 则提供了一种声明式的优雅，将交互逻辑与实现细节分离 <sup>22</sup>。选择哪种更优雅可能取决于开发者的偏好：倾向于与现有生态系统风格统一，还是倾向于更高层次的抽象。
* **易用性**: 两者在基本配置和使用上都相对容易上手。得益于启动器和自动配置，初始设置都很简单。对于深度融入 Spring 技术栈的团队，Spring AI 的一致性可能使其更容易被接受。对于希望快速定义特定交互模式的场景，LangChain4j 的 AiServices 一旦掌握，可以显著提高开发效率 <sup>22</sup>。

选择的关键在于优先考虑与 Spring 生态的紧密结合和风格一致性（Spring AI），还是优先考虑可能更快速、更声明式的交互定义方式（LangChain4j 的 AiServices）。


### **B. 多轮聊天 (聊天内存)**

多轮聊天需要维护对话上下文，即“聊天内存”。


#### **1. Spring AI**



* **方法**: Spring AI 提供了 ChatMemory 抽象来管理对话历史。虽然具体实现未在所有资料中详述，但提到了存在不同的实现类型，例如内存中的实现 (InMemoryChatMemory)，以及潜在的基于 JDBC 或向量存储的实现 <sup>12</sup>。使用时，通常需要从 ChatMemory 中检索历史消息，并将其包含在发送给 ChatClient 的 Prompt 对象中。
* **代码示例 (概念性)**: \
Java \
import org.springframework.ai.chat.client.ChatClient; \
import org.springframework.ai.chat.memory.ChatMemory; \
import org.springframework.ai.chat.memory.InMemoryChatMemory; \
import org.springframework.ai.chat.model.ChatResponse; \
import org.springframework.ai.chat.prompt.Prompt; \
import org.springframework.ai.chat.prompt.SystemPromptTemplate; \
import org.springframework.context.annotation.Bean; \
import org.springframework.context.annotation.Configuration; \
import org.springframework.web.bind.annotation.*; \
import java.util.Map; \
import java.util.List; \
import org.springframework.ai.chat.messages.Message; \
import org.springframework.ai.chat.messages.UserMessage; \
 \
@RestController \
@RequestMapping("/ai/memory/chat") \
public class MemoryChatController { \
 \
    private final ChatClient chatClient; \
    private final ChatMemory chatMemory; // Inject ChatMemory \
 \
    public MemoryChatController(ChatClient.Builder chatClientBuilder, ChatMemory chatMemory) { \
        this.chatClient = chatClientBuilder.build(); \
        this.chatMemory = chatMemory; \
    } \
 \
    @PostMapping("/{conversationId}") \
    public String chat(@PathVariable String conversationId, @RequestBody String message) { \
        // Retrieve history (implementation depends on ChatMemory type) \
        List&lt;Message> history = chatMemory.get(conversationId); \
 \
        // Construct prompt including history \
        // Note: How history is added might vary. This is one possible way. \
        Prompt prompt = new Prompt(new UserMessage(message), Map.of("history", history)); \
 \
        // Call the model \
        ChatResponse response = chatClient.prompt(prompt).call().chatResponse(); \
 \
        // Add user message and AI response to memory \
        // chatMemory.add(conversationId, List.of(new UserMessage(message), response.getResult().getOutput())); \
        // The exact method to add might differ based on ChatMemory implementation and version. \
        // A simpler add might be: chatMemory.add(conversationId, new UserMessage(message)); \
        // chatMemory.add(conversationId, response.getResult().getOutput()); \
 \
        return response.getResult().getOutput().getContent(); \
    } \
} \
 \
@Configuration \
class MemoryConfig { \
    // Provide a ChatMemory bean (e.g., in-memory for simplicity) \
    @Bean \
    public ChatMemory chatMemory() { \
        // This is a basic example; real applications might need more sophisticated memory management. \
        return new InMemoryChatMemory(); \
    } \
} \
此示例展示了注入 ChatMemory 并手动将其管理的 history 添加到 Prompt 中的基本思路。实际的 API 和集成方式可能需要查阅最新文档。
* **分析**: 概念上直接，开发者需要显式地管理如何将历史记录整合到提示中。虽然需要一些手动操作，但也提供了对上下文注入方式的精细控制。与持久化存储（如数据库）的集成是可行的，但需要自定义实现 ChatMemory 接口。


#### **2. LangChain4j**



* **方法**: LangChain4j 同样提供了 ChatMemory 接口及其多种实现（如基于 Token 数量限制的 TokenWindowChatMemory）。其独特之处在于 AiServices 可以通过 @ChatMemoryProvider 注解自动管理聊天内存 <sup>22</sup>。这意味着开发者无需手动处理历史消息的检索和注入。此外，像 ConversationalChain 这样的链式结构也内置了内存管理 <sup>22</sup>。对于持久化，它提供了 ChatMemoryStore 接口供开发者实现。
* **代码示例 (使用 AiServices 自动管理)**: \
Java \
import dev.langchain4j.memory.ChatMemory; \
import dev.langchain4j.memory.chat.ChatMemoryProvider; \
import dev.langchain4j.memory.chat.MessageWindowChatMemory; \
import dev.langchain4j.service.AiServices; \
import dev.langchain4j.service.UserMessage; \
import dev.langchain4j.service.spring.AiService; // Spring specific annotation \
import org.springframework.context.annotation.Bean; \
import org.springframework.context.annotation.Configuration; \
import org.springframework.web.bind.annotation.*; \
import java.util.concurrent.ConcurrentHashMap; \
import java.util.Map; \
 \
// Define the AI Service interface \
@AiService \
public interface ConversationalAssistant { \
    // The second parameter annotated with @MemoryId provides the key for memory lookup \
    String chat(@MemoryId String conversationId, @UserMessage String message); \
} \
 \
@RestController \
@RequestMapping("/ai/langchain4j/memory/chat") \
public class MemoryLangChainController { \
 \
    private final ConversationalAssistant assistant; \
 \
    public MemoryLangChainController(ConversationalAssistant assistant) { \
        this.assistant = assistant; \
    } \
 \
    @PostMapping("/{conversationId}") \
    public String chat(@PathVariable String conversationId, @RequestBody String message) { \
        // AiService handles memory automatically based on conversationId \
        return assistant.chat(conversationId, message); \
    } \
} \
 \
@Configuration \
class LangChainMemoryConfig { \
 \
    // Provides ChatMemory instances based on conversationId \
    @Bean \
    ChatMemoryProvider chatMemoryProvider() { \
        // Store ChatMemory instances per conversation ID \
        Map&lt;String, ChatMemory> memories = new ConcurrentHashMap&lt;>(); \
        return memoryId -> memories.computeIfAbsent(memoryId, id -> \
                MessageWindowChatMemory.builder() \
                       .maxMessages(10) // Example: Keep last 10 messages \
                       .id(id) \
                       .build()); \
    } \
} \
这个示例展示了使用 @AiService 和 ChatMemoryProvider 实现自动化的、按会话 ID 区分的聊天内存管理 <sup>22</sup>。
* **分析**: AiServices 提供的自动化内存管理是 LangChain4j 在此维度上的显著优势 <sup>22</sup>。它通过注解驱动的方式极大地简化了多轮对话状态的维护，减少了样板代码。对于不需要 AiServices 的场景，也可以手动管理 ChatMemory。


#### **3. 评估与比较**



* **简洁性**: LangChain4j 结合 AiServices 和 ChatMemoryProvider 的方式在实现多轮对话时极为简洁，几乎将内存管理的复杂性完全隐藏 <sup>22</sup>。Spring AI 目前看来需要更多手动代码来处理历史记录的传递。
* **优雅性**: LangChain4j 的声明式内存管理方法 (@MemoryId, @ChatMemoryProvider) 被认为是更优雅的解决方案，因为它将内存管理的关注点从业务逻辑中分离出来 <sup>22</sup>。Spring AI 的方式更偏向命令式，但可能在需要对历史记录进行复杂处理或自定义注入逻辑时提供更大的灵活性。
* **易用性**: 对于实现标准的多轮聊天机器人，LangChain4j 的 AiServices 方式无疑更容易上手和使用 <sup>22</sup>。Spring AI 的方法虽然概念清晰，但在具体实现上可能需要开发者编写更多代码。

在多轮聊天内存管理方面，LangChain4j 凭借其 AiServices 提供的自动化和声明式特性，展现出更优的简洁性、优雅性和易用性。这使得开发者能够更快地构建具有上下文记忆能力的聊天应用。


### **C. 流式输出 vs. 普通输出**

流式输出允许逐步接收 LLM 生成的响应，适用于需要实时反馈或处理长文本的场景。


#### **1. Spring AI**



* **方法**: ChatClient 接口统一支持两种模式。普通（同步）输出通过 .call() 方法获取完整的 ChatResponse。流式输出则通过 .stream() 方法实现，返回一个 Project Reactor 的 Flux&lt;ChatResponse> 对象 <sup>4</sup>。
* **代码示例**: \
Java \
import org.springframework.ai.chat.client.ChatClient; \
import org.springframework.http.MediaType; \
import org.springframework.web.bind.annotation.GetMapping; \
import org.springframework.web.bind.annotation.RequestParam; \
import org.springframework.web.bind.annotation.RestController; \
import reactor.core.publisher.Flux; \
 \
@RestController \
public class StreamingChatController { \
 \
    private final ChatClient chatClient; \
 \
    public StreamingChatController(ChatClient.Builder chatClientBuilder) { \
        this.chatClient = chatClientBuilder.build(); \
    } \
 \
    // Normal (synchronous) output \
    @GetMapping("/ai/stream/chat/normal") \
    public String normalChat(@RequestParam(defaultValue = "Write a short poem about spring") String message) { \
        return chatClient.prompt() \
                        .user(message) \
                        .call() \
                        .content(); \
    } \
 \
    // Streaming output using Server-Sent Events (SSE) \
    @GetMapping(value = "/ai/stream/chat/sse", produces = MediaType.TEXT_EVENT_STREAM_VALUE) \
    public Flux&lt;String> streamChat(@RequestParam(defaultValue = "Write a short story") String message) { \
        return chatClient.prompt() \
                        .user(message) \
                        .stream() // Use stream() for streaming \
                        .content(); // Extract content Flux&lt;String> \
    } \
} \
该示例展示了同一个 ChatClient 如何用于普通调用和流式调用。流式输出返回 Flux&lt;String>，可以直接与 Spring WebFlux 控制器结合，用于实现 Server-Sent Events (SSE) <sup>4</sup>。
* **分析**: Spring AI 的流式处理与 Spring 的响应式编程模型（Project Reactor）深度集成。API 设计一致，开发者只需选择 .call() 或 .stream() 即可切换模式。与 Spring WebFlux 的结合非常自然，简化了构建响应式流式 API 的过程。


#### **2. LangChain4j**



* **方法**: LangChain4j 通常提供专门的流式接口，例如 StreamingChatLanguageModel。当使用 AiServices 时，可以将方法的返回类型定义为 dev.langchain4j.data.message.TokenStream 来启用流式响应 <sup>22</sup>。
* **代码示例 (使用 AiServices)**: \
Java \
import dev.langchain4j.service.UserMessage; \
import dev.langchain4j.service.spring.AiService; \
import dev.langchain4j.data.message.TokenStream; // Import TokenStream \
import org.springframework.http.MediaType; \
import org.springframework.web.bind.annotation.*; \
import reactor.core.publisher.Flux; // Import Flux for SSE controller \
 \
@AiService \
public interface StreamingAssistant { \
    // Return TokenStream for streaming \
    TokenStream streamChat(@UserMessage String message); \
} \
 \
@RestController \
@RequestMapping("/ai/langchain4j/stream/chat") \
public class StreamingLangChainController { \
 \
    private final StreamingAssistant assistant; \
 \
    public StreamingLangChainController(StreamingAssistant assistant) { \
        this.assistant = assistant; \
    } \
 \
    // Adapt TokenStream to Flux&lt;String> for SSE \
    @GetMapping(value = "/sse", produces = MediaType.TEXT_EVENT_STREAM_VALUE) \
    public Flux&lt;String> streamChat(@RequestParam(defaultValue = "Write a long explanation of photosynthesis") String message) { \
        TokenStream tokenStream = assistant.streamChat(message); \
 \
        // Need to adapt LangChain4j's TokenStream to Reactor's Flux \
        // This requires a custom implementation or utility. \
        // Example conceptual adaptation: \
        return Flux.create(emitter -> { \
            tokenStream.onNext(emitter::next) \
                      .onComplete(info -> emitter.complete()) \
                      .onError(emitter::error) \
                      .start(); \
        }); \
    } \
} \
此示例展示了 AiService 方法返回 TokenStream <sup>22</sup>。在控制器中，需要将 TokenStream 适配为 Spring WebFlux 所需的 Flux 类型，以便实现 SSE 输出。
* **分析**: LangChain4j 需要使用特定的流式模型接口或 AiServices 的 TokenStream 返回类型。AiServices 的声明式方式很简洁。然而，其 TokenStream 是 LangChain4j 特有的类型，在与 Spring WebFlux 等基于 Reactor 的框架集成时，需要进行一层适配转换。


#### **3. 评估与比较**



* **简洁性**: 在 API 定义层面，Spring AI 的 .call() vs .stream() 切换可能略显简洁。LangChain4j 的 AiServices 返回 TokenStream 在服务定义上也很简洁。但在控制器实现 SSE 时，Spring AI 返回的 Flux 可以直接使用，而 LangChain4j 的 TokenStream 需要额外适配代码。
* **优雅性**: Spring AI 使用标准的 Flux 类型，与 Spring 的响应式生态系统无缝对接，这被认为是其优雅之处 <sup>4</sup>。LangChain4j 的 TokenStream 在 AiServices 内部是优雅的 <sup>22</sup>，但在需要与外部响应式框架（如 WebFlux）交互时，适配层可能略显笨拙。
* **易用性**: 两者实现流式输出都相对直接。对于已经在使用 Spring WebFlux 的开发者来说，Spring AI 的 Flux 返回值更为直观和易用。LangChain4j 需要开发者理解并处理其 TokenStream 类型及其与目标框架的适配。

总体而言，两个框架都提供了可靠的流式输出能力。Spring AI 凭借其与 Project Reactor 的原生集成，在与 Spring 响应式技术栈（特别是 WebFlux）结合使用时，提供了更平滑、更自然的开发体验。


### **D. 聊天持久化 (以 MySQL 为概念示例)**

将聊天记录持久化到数据库（如 MySQL）对于需要长期保存对话历史的应用至关重要。


#### **1. Spring AI**



* **方法**: Spring AI 本身似乎不直接提供针对特定数据库（如 MySQL）的 ChatMemory 实现。它依赖于开发者利用标准的 Spring Data 技术（如 Spring Data JPA 或 Spring Data JDBC）来实现持久化。开发者需要定义数据模型（如 JPA 实体），创建对应的 Repository 接口，然后实现 Spring AI 的 ChatMemory 接口（或更底层的存储接口，如果存在的话），使用 Repository 来读写数据库。资料中提到了 JDBC Chat Memory <sup>12</sup>，这暗示了框架提供了用于集成自定义持久化逻辑的扩展点。
* **代码示例 (概念性)**: \
Java \
import jakarta.persistence.*; // JPA annotations \
import org.springframework.data.jpa.repository.JpaRepository; \
import org.springframework.stereotype.Repository; \
import org.springframework.ai.chat.memory.ChatMemory; \
import org.springframework.ai.chat.messages.Message; \
import org.springframework.ai.chat.messages.MessageType; // Assuming MessageType enum exists \
import java.util.List; \
import java.time.Instant; \
import java.util.stream.Collectors; \
 \
// 1. Define JPA Entity for Message \
@Entity \
class ChatMessageEntity { \
    @Id @GeneratedValue \
    private Long id; \
    private String conversationId; \
    @Enumerated(EnumType.STRING) \
    private MessageType messageType; // USER or ASSISTANT \
    @Lob // For potentially long message content \
    private String content; \
    private Instant timestamp; \
    // Getters and Setters... \
} \
 \
// 2. Create Spring Data JPA Repository \
@Repository \
interface ChatMessageRepository extends JpaRepository&lt;ChatMessageEntity, Long> { \
    List&lt;ChatMessageEntity> findByConversationIdOrderByTimestampAsc(String conversationId); \
} \
 \
// 3. Implement Spring AI's ChatMemory (or relevant store interface) \
// Note: This is a simplified conceptual implementation. \
// The actual interface and methods might differ in Spring AI. \
// @Component // Register as a Spring bean \
// class MySqlChatMemory implements ChatMemory { \
//     private final ChatMessageRepository repository; \
// \
//     public MySqlChatMemory(ChatMessageRepository repository) { \
//         this.repository = repository; \
//     } \
// \
//     @Override \
//     public void add(String conversationId, List&lt;Message> messages) { \
//         List&lt;ChatMessageEntity> entities = messages.stream() \
//                .map(msg -> convertToEntity(conversationId, msg)) \
//                .collect(Collectors.toList()); \
//         repository.saveAll(entities); \
//     } \
// \
//     @Override \
//     public List&lt;Message> get(String conversationId, int lastN) { // Assuming get takes lastN parameter \
//         // Implement logic to get last N messages using repository \
//         // This requires careful implementation based on ChatMemory interface contract \
//         List&lt;ChatMessageEntity> entities = repository.findByConversationIdOrderByTimestampAsc(conversationId); \
//         // Apply lastN logic if needed \
//         return entities.stream() \
//                .map(this::convertToMessage) \
//                .collect(Collectors.toList()); \
//     } \
// \
//     @Override \
//     public void clear(String conversationId) { \
//         // Implement clear logic using repository \
//     } \
// \
//     // Helper methods to convert between Spring AI Message and JPA Entity \
//     private ChatMessageEntity convertToEntity(String conversationId, Message message) { /*... */ return null;} \
//     private Message convertToMessage(ChatMessageEntity entity) { /*... */ return null;} \
// } \

* **分析**: 这种方法充分利用了 Spring 生态系统中成熟且强大的 Spring Data 模块。开发者可以获得高度的灵活性和对持久化逻辑的完全控制。缺点是需要编写标准的持久化层代码，工作量与其他使用 Spring Data 的场景类似。


#### **2. LangChain4j**



* **方法**: LangChain4j 提供了 ChatMemoryStore 接口，作为聊天记录持久化的标准扩展点 <sup>22</sup>。与 Spring AI 类似，它不直接提供 MySQL 的实现，而是期望开发者使用标准的 Java 持久化技术（如 JPA、JDBC）来实现这个接口。一旦实现了 ChatMemoryStore，就可以配置 ChatMemory 实例（例如 PersistentChatMemory）或 AiServices 来使用这个自定义的存储实现。资料中提到了持久化内存的示例链接 <sup>22</sup>。
* **代码示例 (概念性)**: \
Java \
import dev.langchain4j.data.message.ChatMessage; \
import dev.langchain4j.store.memory.chat.ChatMemoryStore; \
import jakarta.persistence.*; // Assuming JPA usage \
import org.springframework.data.jpa.repository.JpaRepository; \
import org.springframework.stereotype.Repository; \
import java.util.List; \
import java.time.Instant; \
import java.util.stream.Collectors; \
 \
// 1. Define JPA Entity (similar to Spring AI example) \
// @Entity \
// class LangChainChatMessageEntity { /*... fields: id, conversationId, type, text, timestamp... */ } \
 \
// 2. Create Spring Data JPA Repository \
// @Repository \
// interface LangChainChatMessageRepository extends JpaRepository&lt;LangChainChatMessageEntity, Long> { \
//     List&lt;LangChainChatMessageEntity> findByMemoryIdOrderByTimestampAsc(String memoryId); \
// } \
 \
// 3. Implement LangChain4j's ChatMemoryStore \
// @Component // Register as a Spring bean \
// class MySqlChatMemoryStore implements ChatMemoryStore { \
//     private final LangChainChatMessageRepository repository; \
// \
//     public MySqlChatMemoryStore(LangChainChatMessageRepository repository) { \
//         this.repository = repository; \
//     } \
// \
//     @Override \
//     public List&lt;ChatMessage> getMessages(Object memoryId) { \
//         String id = memoryId.toString(); \
//         List&lt;LangChainChatMessageEntity> entities = repository.findByMemoryIdOrderByTimestampAsc(id); \
//         return entities.stream() \
//                .map(this::convertToChatMessage) \
//                .collect(Collectors.toList()); \
//     } \
// \
//     @Override \
//     public void updateMessages(Object memoryId, List&lt;ChatMessage> messages) { \
//         String id = memoryId.toString(); \
//         // Implement logic to save/update messages for the given memoryId \
//         // This might involve deleting old messages and saving new ones, \
//         // or more sophisticated update logic depending on requirements. \
//         List&lt;LangChainChatMessageEntity> entities = messages.stream() \
//                .map(msg -> convertToEntity(id, msg)) \
//                .collect(Collectors.toList()); \
//         // Example: Delete existing and save new (simplistic) \
//         // repository.deleteByMemoryId(id); \
//         repository.saveAll(entities); \
//     } \
// \
//     @Override \
//     public void deleteMessages(Object memoryId) { \
//         String id = memoryId.toString(); \
//         // Implement delete logic using repository \
//         // repository.deleteByMemoryId(id); \
//     } \
// \
//     // Helper methods to convert between LangChain4j ChatMessage and JPA Entity \
//     private LangChainChatMessageEntity convertToEntity(String memoryId, ChatMessage message) { /*... */ return null;} \
//     private ChatMessage convertToChatMessage(LangChainChatMessageEntity entity) { /*... */ return null;} \
// } \

* **分析**: LangChain4j 提供了一个清晰的 ChatMemoryStore 接口作为持久化集成点。实现方式同样依赖于标准的 Java/Spring 持久化技术。与 Spring AI 相比，实现持久化所需的工作量和方法非常相似。


#### **3. 评估与比较**



* **简洁性**: 两者在实现 MySQL 持久化方面都需要编写相似数量的自定义代码。因为它们都不提供开箱即用的 MySQL 存储实现，开发者都需要定义实体、编写 Repository 并实现框架提供的持久化接口/抽象。因此，在简洁性上没有显著差异。
* **优雅性**: 两种方法都很优雅，因为它们都遵循了良好的设计原则：提供清晰的扩展点（Spring AI 的 ChatMemory，LangChain4j 的 ChatMemoryStore），并允许开发者利用成熟的、标准的持久化模式（如 JPA 和 Spring Data）。
* **易用性**: 易用性主要取决于开发者对 Spring Data JPA 或 JDBC 的熟悉程度。两个框架都需要开发者完成标准的持久化实现任务。LangChain4j 明确定义的 ChatMemoryStore 接口可能为需要实现的功能提供了稍微更具体的指导。

结论是，聊天记录的持久化对于这两个框架来说，很大程度上是一个标准的集成任务，依赖于外部的持久化库（主要是 Spring Data）。框架本身并不直接简化数据库交互的核心逻辑，但都提供了必要的抽象层来接入持久化实现。因此，在选择框架时不应过多地基于 MySQL 持久化的难易程度，因为两者的实现方法和工作量非常接近。


### **E. 多模态聊天**

多模态聊天允许在对话中包含除文本之外的其他类型的数据，例如图像。


#### **1. Spring AI**



* **方法**: Spring AI 设计上支持多模态输入，允许在提示中包含不同类型的媒体数据 <sup>4</sup>。这通常涉及到扩展其 Message 或 Prompt 结构，以容纳图像数据（例如，通过 URL 或 Base64 编码的字符串）。具体实现方式依赖于所使用的底层聊天模型（例如 OpenAI 的 GPT-4o 或 Google 的 Gemini）及其 API 要求。资料中提到了针对 Mistral AI、Ollama 和 OpenAI 的多模态示例 <sup>12</sup>。
* **代码示例 (概念性)**: \
Java \
import org.springframework.ai.chat.client.ChatClient; \
import org.springframework.ai.chat.messages.Media; // Assuming a Media class/interface exists \
import org.springframework.ai.chat.messages.UserMessage; \
import org.springframework.ai.chat.prompt.Prompt; \
import org.springframework.http.MediaType; // For MimeType \
import org.springframework.util.MimeType; // For MimeType \
import java.net.URL; \
import java.util.List; \
 \
// In a Controller or Service: \
// public String multimodalChat(ChatClient chatClient, String textPrompt, URL imageUrl) { \
//     // Construct a UserMessage with text and image data \
//     // The exact API might differ. This demonstrates the concept. \
//     UserMessage userMessage = new UserMessage( \
//             textPrompt, // Text part \
//             List.of(new Media(MimeType.valueOf(MediaType.IMAGE_JPEG_VALUE), imageUrl)) // Image part \
//     ); \
// \
//     Prompt prompt = new Prompt(userMessage); \
// \
//     return chatClient.prompt(prompt) \
//                     .call() \
//                     .content(); \
// } \
此示例展示了如何概念性地构建一个包含文本和图像 URL 的 UserMessage，并将其传递给 ChatClient <sup>12</sup>。实际 API 可能需要查阅特定模型集成的文档。
* **分析**: Spring AI 提供了支持多模态的基础架构。实现细节与所选的 LLM 提供商紧密相关。其方法感觉像是对现有 Message/Prompt 概念的自然扩展。


#### **2. LangChain4j**



* **方法**: LangChain4j 通过其消息结构中的 Content 对象来支持多模态。一个 UserMessage 可以包含一个 Content 列表，每个 Content 对象代表一种模态（例如 TextContent、ImageContent）。框架负责将这种结构化的多模态输入传递给兼容的模型。
* **代码示例 (概念性)**: \
Java \
import dev.langchain4j.data.message.UserMessage; \
import dev.langchain4j.data.message.AiMessage; \
import dev.langchain4j.data.message.ImageContent; // Specific content type for images \
import dev.langchain4j.data.message.TextContent; // Specific content type for text \
import dev.langchain4j.model.chat.ChatLanguageModel; \
import java.net.URI; \
 \
// In a Controller or Service: \
// public String multimodalLangChainChat(ChatLanguageModel chatModel, String textPrompt, URI imageUrl) { \
//     // Create a UserMessage containing multiple Content objects \
//     UserMessage userMessage = UserMessage.from( \
//             TextContent.from(textPrompt), \
//             ImageContent.from(imageUrl) // Assuming ImageContent can be created from URI \
//     ); \
// \
//     AiMessage response = chatModel.generate(userMessage).content(); \
//     return response.text(); \
// } \
此示例展示了如何创建一个包含 TextContent 和 ImageContent 的 UserMessage <sup>2</sup>。具体 API 和 ImageContent 的创建方式（例如，从 URL、Base64 或文件）需要查阅文档。
* **分析**: LangChain4j 提供了明确的 Content 类型抽象来处理不同的模态，结构清晰。实现同样依赖于底层模型的支持。


#### **3. 评估与比较**



* **简洁性**: 两者在构建多模态消息/提示对象方面所需的工作量可能相似。API 设计上的差异在于如何表示不同的模态（例如，Spring AI 可能扩展 Message 本身，而 LangChain4j 使用 Content 对象列表）。两者都不算复杂。
* **优雅性**: LangChain4j 显式的 Content 类型（TextContent, ImageContent 等）在结构上可能略显优雅，因为它清晰地将不同模态的数据封装在各自的对象中。Spring AI 的方法（可能是在 Message 中添加媒体列表）也是一种有效且可能更简单的设计。
* **易用性**: 假设底层模型支持多模态，两者的使用都相对直接。主要的挑战通常在于根据模型的要求正确准备和格式化多模态数据（例如，加载图像、进行 Base64 编码），这部分工作发生在框架调用之外。

对于多模态聊天，两个框架都提供了必要的基础支持。实际的可用性和效果主要取决于所选择的 LLM 提供商及其 API 能力。框架的作用主要是提供将这些多模态数据发送给模型的结构化途径。因此，在选择框架时，多模态支持本身可能不是决定性因素，更重要的是确保所选的 LLM 能够满足应用的多模态需求。


### **F. 检索增强生成 (RAG)**

RAG 是一种让 LLM 能够访问和利用外部知识库（通常是私有数据）的技术，常用于构建基于文档的问答系统。


#### **1. Spring AI**



* **方法**: Spring AI 提供了构建 RAG 流程所需的端到端组件，覆盖了数据提取、转换、加载（ETL）和检索、生成等环节 <sup>4</sup>。
    * **ETL**: 支持多种 DocumentReader 从不同来源（PDF, JSON, Markdown, Text, Tika 等 <sup>6</sup>）加载文档。提供 DocumentTransformer 用于文档处理，如使用 TokenTextSplitter 进行分割，或进行元数据增强（如添加关键词、摘要 <sup>12</sup>）。
    * **存储与检索**: 使用 EmbeddingClient <sup>11</sup> 生成向量嵌入，并通过 VectorStore 接口 <sup>4</sup> 将文档（或其片段）及其嵌入存储到向量数据库中。Spring AI 支持众多主流向量数据库 <sup>4</sup>。其 VectorStore API 的一个亮点是提供了可移植的、类似 SQL 的元数据过滤能力 <sup>4</sup>。检索时，使用 VectorStore.similaritySearch() 方法查找与查询相关的文档片段。
    * **生成**: 将检索到的文档片段作为上下文信息，构建 Prompt 并发送给 ChatClient 进行最终的答案生成。
* **代码示例 (流程概述)**: \
Java \
import org.springframework.ai.reader.ExtractedTextFormatter; \
import org.springframework.ai.reader.pdf.PagePdfDocumentReader; // Example Reader \
import org.springframework.ai.transformer.splitter.TokenTextSplitter; // Example Splitter \
import org.springframework.ai.vectorstore.VectorStore; // Core VectorStore interface \
import org.springframework.ai.document.Document; \
import org.springframework.ai.embedding.EmbeddingClient; \
import org.springframework.ai.chat.client.ChatClient; \
import org.springframework.ai.chat.prompt.Prompt; \
import org.springframework.ai.chat.prompt.PromptTemplate; \
import org.springframework.core.io.Resource; \
import java.util.List; \
import java.util.Map; \
import java.util.stream.Collectors; \
 \
// Conceptual RAG Service \
// @Service \
// public class RagService { \
//     private final EmbeddingClient embeddingClient; // Injected \
//     private final VectorStore vectorStore;       // Injected \
//     private final ChatClient chatClient;         // Injected \
// \
//     // Constructor injection... \
// \
//     public void loadDocument(Resource pdfResource) { \
//         // 1. Load Document \
//         PagePdfDocumentReader pdfReader = new PagePdfDocumentReader(pdfResource); \
//         List&lt;Document> docs = pdfReader.get(); \
// \
//         // 2. Split Document \
//         TokenTextSplitter textSplitter = new TokenTextSplitter(); \
//         List&lt;Document> splitDocs = textSplitter.apply(docs); \
// \
//         // 3. Embed and Store (VectorStore likely handles embedding internally via EmbeddingClient) \
//         vectorStore.add(splitDocs); \
//     } \
// \
//     public String answerQuestion(String query) { \
//         // 4. Retrieve relevant documents \
//         List&lt;Document> relevantDocs = vectorStore.similaritySearch(query); \
// \
//         // 5. Augment prompt and generate answer \
//         String context = relevantDocs.stream() \
//                                     .map(Document::getContent) \
//                                     .collect(Collectors.joining("\n")); \
// \
//         String template = """ \
//                 Use the following information to answer the question: \
//                 {context} \
// \
//                 Question: {query} \
//                 """; \
//         PromptTemplate promptTemplate = new PromptTemplate(template); \
//         Prompt prompt = promptTemplate.create(Map.of("context", context, "query", query)); \
// \
//         return chatClient.prompt(prompt).call().content(); \
//     } \
// } \
此示例勾勒了使用 Spring AI 组件进行文档加载、分割、存储、检索和生成答案的基本流程 <sup>6</sup>。
* **分析**: Spring AI 提供了一套全面的 RAG 工具。其与 Spring 资源抽象 (Resource)、数据处理模式的结合感觉自然。可移植的 VectorStore API 及强大的过滤功能是其主要优势 <sup>4</sup>。


#### **2. LangChain4j**



* **方法**: LangChain4j 同样提供了广泛的 RAG 支持，覆盖了从数据摄入到检索生成的整个流程 <sup>10</sup>。
    * **核心抽象**: 包括 Document（代表整个文档）、TextSegment（文档片段）、DocumentLoader（加载器）、DocumentSplitter（分割器，提供多种实现如按段落、行、句子、递归分割等 <sup>21</sup>）、EmbeddingModel（嵌入模型）、EmbeddingStore（向量存储）<sup>21</sup>。
    * **摄入**: 提供了 EmbeddingStoreIngestor 工具类，可以简化文档加载、分割、嵌入和存储到 EmbeddingStore 的流程 <sup>20</sup>。
    * **RAG 模式**: LangChain4j 明确提出了三种 RAG 实现模式 <sup>21</sup>：
        * **Easy RAG**: 最简单的入门方式，隐藏了许多底层细节（如选择 Embedding 模型、向量存储、解析和分割文档等），开发者只需指定文档来源即可 <sup>21</sup>。
        * **Naive RAG**: 使用向量搜索的基本 RAG 实现。
        * **Advanced RAG**: 模块化的 RAG 框架，允许进行更复杂的操作，如查询转换、多源检索、结果重排等 <sup>21</sup>。
    * **检索与生成**: 使用 EmbeddingStore.findRelevant() 方法检索相关片段，然后将这些片段作为上下文提供给 ChatLanguageModel 或 AiServices 进行生成。AiServices 可能提供注解（如 @Relevant）来简化上下文注入。
* **代码示例 (使用 EmbeddingStoreIngestor)**: \
Java \
import dev.langchain4j.data.document.Document; \
import dev.langchain4j.data.document.loader.FileSystemDocumentLoader; // Example Loader \
import dev.langchain4j.data.document.splitter.DocumentSplitters; // Splitter utility \
import dev.langchain4j.model.embedding.EmbeddingModel; // EmbeddingModel interface \
import dev.langchain4j.store.embedding.EmbeddingStore; // EmbeddingStore interface \
import dev.langchain4j.store.embedding.EmbeddingStoreIngestor; // Ingestor utility \
import dev.langchain4j.model.chat.ChatLanguageModel; \
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever; // Retriever \
import dev.langchain4j.rag.query.Query; \
import dev.langchain4j.data.segment.TextSegment; \
import java.nio.file.Path; \
import java.util.List; \
import java.util.stream.Collectors; \
 \
// Conceptual RAG Service using LangChain4j \
// @Service \
// public class RagLangChainService { \
//     private final EmbeddingModel embeddingModel; // Injected \
//     private final EmbeddingStore&lt;TextSegment> embeddingStore; // Injected \
//     private final ChatLanguageModel chatModel; // Injected \
//     private final EmbeddingStoreContentRetriever retriever; // Can be built from EmbeddingStore & Model \
// \
//     // Constructor injection... \
//     // retriever = EmbeddingStoreContentRetriever.builder() \
//     //        .embeddingStore(embeddingStore) \
//     //        .embeddingModel(embeddingModel) \
//     //        .maxResults(3) // Example: retrieve top 3 \
//     //        .build(); \
// \
//     public void loadDocument(Path documentPath) { \
//         // 1. Load Document \
//         Document document = FileSystemDocumentLoader.loadDocument(documentPath); \
// \
//         // 2. Create Ingestor (handles splitting, embedding, storing) \
//         EmbeddingStoreIngestor ingestor = EmbeddingStoreIngestor.builder() \
//                .documentSplitter(DocumentSplitters.recursive(300, 0)) // Example splitter \
//                .embeddingModel(embeddingModel) \
//                .embeddingStore(embeddingStore) \
//                .build(); \
// \
//         // 3. Ingest the document \
//         ingestor.ingest(document); \
//     } \
// \
//     public String answerQuestion(String query) { \
//         // 4. Retrieve relevant segments \
//         List&lt;TextSegment> relevantSegments = retriever.retrieve(Query.from(query)); \
// \
//         // 5. Augment prompt and generate answer \
//         String context = relevantSegments.stream() \
//                                         .map(TextSegment::text) \
//                                         .collect(Collectors.joining("\n\n")); \
// \
//         String userMessage = String.format( \
//                 "Based on the following information:\n---\n%s\n---\nAnswer the question: %s", \
//                 context, query); \
// \
//         return chatModel.generate(userMessage); \
//     } \
// } \
此示例展示了使用 EmbeddingStoreIngestor 简化摄入过程，以及使用 EmbeddingStoreContentRetriever 进行检索的基本流程 <sup>20</sup>。
* **分析**: LangChain4j 提供了非常结构化和模块化的 RAG 组件 <sup>10</sup>。"Easy RAG" 功能显著降低了入门门槛 <sup>21</sup>。EmbeddingStoreIngestor 简化了数据准备和存储的步骤 <sup>20</sup>。Advanced RAG 选项表明其具有高度的可定制性和扩展性 <sup>21</sup>。


#### **3. 评估与比较**



* **简洁性**: 对于希望快速启动 RAG 功能的用户，LangChain4j 的 "Easy RAG" <sup>21</sup> 可能是最简洁的选择。对于标准的 RAG 流程，两者都需要开发者连接相似的组件（加载、分割、嵌入、存储、检索、增强）。LangChain4j 的 EmbeddingStoreIngestor <sup>20</sup> 在简化数据摄入方面可能略有优势。
* **优雅性**: 两者都提供了优雅的抽象。Spring AI 的 VectorStore API 及其强大的类 SQL 过滤功能 <sup>4</sup> 设计得非常优雅且功能强大。LangChain4j 对 RAG 流程本身的明确分层（Easy/Naive/Advanced RAG <sup>21</sup>）以及模块化的组件设计也体现了其结构上的优雅性。
* **易用性**: LangChain4j 的 "Easy RAG" <sup>21</sup> 降低了初学者的使用难度。对于有经验的开发者，两个框架都需要对 RAG 的核心概念（文档、嵌入、向量存储等）有一定理解。Spring AI 的 API 风格可能让 Spring 开发者感觉更熟悉，而 LangChain4j 提供了清晰的构建块和不同的复杂度层次供选择 <sup>21</sup>。

总结来说，两个框架都具备强大的 RAG 能力。LangChain4j 似乎更侧重于抽象 RAG 流程本身，提供了不同复杂度的预设模式（特别是 "Easy RAG" <sup>21</sup>），有助于快速启动。而 Spring AI 则提供了功能强大、可移植性好的核心组件（尤其是 VectorStore API <sup>4</sup>），这些组件能够很好地融入 Spring 的整体开发模式。选择可能取决于开发者是倾向于一个更引导式的 RAG 设置（LangChain4j），还是倾向于在 Spring 风格下使用灵活的组件进行构建（Spring AI）。


## **IV. 整体评估与建议**


### **A. 核心发现总结**

通过对六个关键维度的详细比较，可以总结出 Spring AI 和 LangChain4j 各自的核心特点和优势：



* **Spring AI**:
    * **优势**: 与 Spring 生态系统（包括 Spring Boot, Spring Data, Project Reactor/WebFlux）的集成最为紧密和自然 <sup>1</sup>。API 设计（如 ChatClient）遵循 Spring 开发者熟悉的模式 <sup>4</sup>。提供了强大且可移植的 VectorStore API，特别是其类 SQL 元数据过滤功能 <sup>4</sup>。具备良好的可观测性集成潜力 <sup>4</sup>。
    * **潜在挑战**: 对于某些高级抽象（如 AiServices 提供的自动化内存管理）可能需要更多手动编码或依赖未来版本的功能（如 Advisors <sup>4</sup> 或 Agentic Patterns <sup>13</sup>）。
* **LangChain4j**:
    * **优势**: 提供了非常强大的高层抽象，尤其是 AiServices <sup>22</sup>，极大地简化了常见任务（如聊天内存管理、流式处理、结构化输出）的实现，采用声明式编程风格。提供了 "Easy RAG" <sup>21</sup> 等功能，降低了特定用例的入门门槛。框架设计强调跨 LLM 提供商和向量存储的统一 API 和可移植性 <sup>9</sup>。
    * **潜在挑战**: 虽然提供了官方 Spring 集成 <sup>23</sup>，但其核心抽象（如 TokenStream）可能不如 Spring AI 的原生组件（如 Flux）与 Spring 响应式生态结合得那么无缝。


### **B. 简洁性、优雅性与易用性综合比较**



* **简洁性**: 没有绝对的赢家，取决于具体任务。LangChain4j 凭借其高层抽象（AiServices, "Easy RAG"）在特定常见用例上通常更为简洁 <sup>21</sup>。Spring AI 依靠自动配置也很简洁，但在实现需要更多编排的复杂流程时，可能需要编写更多命令式代码。
* **优雅性**: 这是主观评价。Spring AI 的优雅在于其与 Spring 生态的和谐统一，提供了“原生”的 Spring 体验。LangChain4j 的优雅则体现在其强大的抽象能力（如 AiServices 的声明式风格）和清晰的模块化设计（如 RAG 阶段划分）。
* **易用性**: LangChain4j 的高层抽象可能让初学者在处理特定任务（如带内存的聊天机器人）时感觉更容易上手。而对于经验丰富的 Spring 开发者来说，Spring AI 的熟悉感和一致性可能使其更容易被采纳和融入现有项目。


### **C. 框架对比总结表**

为了更直观地展示对比结果，下表总结了两个框架在关键维度上的表现：


<table>
  <tr>
   <td><strong>维度/因素</strong>
   </td>
   <td><strong>Spring AI (简洁性/优雅性/易用性)</strong>
   </td>
   <td><strong>LangChain4j (简洁性/优雅性/易用性)</strong>
   </td>
   <td><strong>关键差异点</strong>
   </td>
  </tr>
  <tr>
   <td><strong>基本配置 (OpenAI)</strong>
   </td>
   <td>高/高/高 (启动器, 自动配置, ChatClient 风格统一)
   </td>
   <td>高/高/高 (启动器, 自动配置, generate() 直接, AiServices 声明式)
   </td>
   <td>Spring AI 更贴近 Spring 风格, LangChain4j AiServices 提供独特抽象
   </td>
  </tr>
  <tr>
   <td><strong>多轮聊天 (内存)</strong>
   </td>
   <td>中/中/中 (提供 ChatMemory, 可能需手动注入历史)
   </td>
   <td>高/高/高 (AiServices + @ChatMemoryProvider 自动化管理)
   </td>
   <td>LangChain4j AiServices 自动化程度高
   </td>
  </tr>
  <tr>
   <td><strong>流式/普通输出</strong>
   </td>
   <td>高/高/高 (统一 ChatClient, .call() vs .stream(), Flux 原生集成 WebFlux)
   </td>
   <td>高/中/中 (Streaming*Model 或 TokenStream, 需适配 Flux)
   </td>
   <td>Spring AI 与 Reactor/WebFlux 集成更无缝
   </td>
  </tr>
  <tr>
   <td><strong>持久化 (MySQL概念)</strong>
   </td>
   <td>中/高/中 (依赖 Spring Data 实现 ChatMemory, 灵活但需编码)
   </td>
   <td>中/高/中 (依赖标准持久化实现 ChatMemoryStore, 接口清晰)
   </td>
   <td>两者都需要类似的标准持久化实现工作
   </td>
  </tr>
  <tr>
   <td><strong>多模态聊天</strong>
   </td>
   <td>中/中/中 (支持基础结构, 依赖模型和具体 API)
   </td>
   <td>中/高/中 (支持 Content 类型抽象, 结构清晰, 依赖模型)
   </td>
   <td>LangChain4j Content 抽象更显式, 但核心依赖 LLM 支持
   </td>
  </tr>
  <tr>
   <td><strong>RAG</strong>
   </td>
   <td>高/高/高 (组件全面, VectorStore API 强大且可移植)
   </td>
   <td>高/高/高 (结构化 RAG 模式, "Easy RAG" 入门快, Ingestor 简化摄入)
   </td>
   <td>Spring AI VectorStore API 突出, LangChain4j "Easy RAG" 和流程抽象是亮点
   </td>
  </tr>
  <tr>
   <td><strong>生态系统契合度</strong>
   </td>
   <td>非常高 (原生 Spring 项目, 设计原则一致)
   </td>
   <td>高 (官方提供良好 Spring 集成)
   </td>
   <td>Spring AI 是 Spring 生态的原生组成部分
   </td>
  </tr>
  <tr>
   <td><strong>成熟度/社区</strong>
   </td>
   <td>快速发展中 (接近或已 GA), 社区活跃, 资源丰富 <sup>17</sup>
   </td>
   <td>较成熟 (活跃开发, 版本迭代快), 社区活跃, 文档示例齐全 <sup>8</sup>
   </td>
   <td>两者均活跃发展, LangChain4j 起步稍早
   </td>
  </tr>
</table>


*(评分：高/中/低 仅为相对比较)*


### **D. 细化建议**

选择哪个框架并非绝对的“哪个更好”，而应基于项目具体需求、团队技术背景和开发偏好：



* **选择 Spring AI 的场景**:
    * 项目深度依赖 Spring 生态系统，追求技术栈的统一性和原生体验。
    * 需要充分利用 Spring 的响应式编程模型（Project Reactor / WebFlux），特别是对于流式处理。
    * 团队成员对 Spring 框架及其设计模式（如 WebClient 风格的 API、自动配置）非常熟悉。
    * 需要对 RAG 中的向量存储进行复杂查询和过滤（利用其强大的 VectorStore API）。
    * 长期目标是构建复杂的、需要精细控制的 AI 系统或 Agentic 应用 <sup>13</sup>。
* **选择 LangChain4j 的场景**:
    * 需要快速开发常见的 LLM 应用场景，如带记忆的聊天机器人、基础的 RAG 系统。
    * 偏好声明式的编程风格，希望通过高层抽象（如 AiServices <sup>22</sup>）减少样板代码。
    * 重视框架在不同 LLM 提供商和向量存储之间的可移植性。
    * 希望利用 "Easy RAG" <sup>21</sup> 等功能快速启动项目或进行原型验证。


### **E. 生态与社区因素**

两个框架都拥有活跃的社区和不断完善的资源。Spring AI 作为 Spring 官方项目，其文档 <sup>4</sup>、示例 <sup>12</sup> 和社区支持（如 "Awesome Spring AI" <sup>5</sup> 和 GitHub Discussions <sup>19</sup>）都在快速增长。LangChain4j 也拥有详尽的文档 <sup>8</sup>、丰富的示例 <sup>9</sup> 和活跃的社区（GitHub, Discord <sup>9</sup>）。值得注意的是，LangChain4j 的 Spring 支持已从早期的社区项目整合为官方维护 <sup>20</sup>，这保证了其与核心库的同步发展和长期支持。

最终的选择应权衡框架的哲学、特定功能的实现方式以及团队的舒适度。


## **V. 结论**


### **A. 最终总结**

Spring AI 和 LangChain4j 都是当前 Java/Spring Boot 生态系统中用于构建 LLM 驱动应用的强大框架。



* **Spring AI** 的核心身份是 **Spring 原生的 AI 应用框架**。它将 Spring 的设计哲学深度应用于 AI 工程，强调与 Spring 生态的无缝集成、提供开发者熟悉的 API 模式，并在 RAG 等领域提供了强大的基础组件（如可移植的 VectorStore API）。
* **LangChain4j** 则定位为 **功能全面的 Java LLM 工具箱，并提供良好的 Spring 集成**。它的突出特点在于提供了强大的高层抽象（尤其是 AiServices），采用声明式方法简化常见任务，并极度重视跨平台的可移植性。

关键差异在于：Spring AI 提供了更深入的 Spring 生态整合和一致的开发体验；而 LangChain4j 则在特定场景下通过更高层次的抽象提供了更快的开发路径和更强的声明式特性。


### **B. 结语展望**

对于在 Spring Boot 环境中寻求集成 LLM 功能的 Java 开发者而言，Spring AI 和 LangChain4j 都是值得考虑的、功能强大的选项。它们各自的优势使得它们适用于不同的项目需求和团队偏好。最终决策应基于对项目目标的清晰理解、团队现有技术栈的熟悉程度以及对两种框架不同开发风格的评估。建议在做出最终选择前，可以尝试使用两个框架分别实现一个简单的原型用例 <sup>9</sup>，以亲身体验它们的开发流程和易用性。随着两个框架的持续发展和 AI 技术的不断进步，Java 在构建智能应用方面的能力将变得更加强大。


#### 引用的著作



1. Integrating AI with Spring Boot: A Beginner's Guide - mydeveloperplanet.com, 访问时间为 四月 28, 2025， [https://mydeveloperplanet.com/2025/01/08/integrating-ai-with-spring-boot-a-beginners-guide/](https://mydeveloperplanet.com/2025/01/08/integrating-ai-with-spring-boot-a-beginners-guide/)
2. How to incorporate LM/LLM features into Java using Langchain4j - Kindgeek, 访问时间为 四月 28, 2025， [https://kindgeek.com/blog/post/experiments-with-langchain4j-or-java-way-to-llm-powered-applications](https://kindgeek.com/blog/post/experiments-with-langchain4j-or-java-way-to-llm-powered-applications)
3. Looking for a llm which is fine tuned specifically for Java : r/LocalLLaMA - Reddit, 访问时间为 四月 28, 2025， [https://www.reddit.com/r/LocalLLaMA/comments/18meji3/looking_for_a_llm_which_is_fine_tuned/](https://www.reddit.com/r/LocalLLaMA/comments/18meji3/looking_for_a_llm_which_is_fine_tuned/)
4. Spring AI, 访问时间为 四月 28, 2025， [https://spring.io/projects/spring-ai/](https://spring.io/projects/spring-ai/)
5. spring-projects/spring-ai: An Application Framework for AI Engineering - GitHub, 访问时间为 四月 28, 2025， [https://github.com/spring-projects/spring-ai](https://github.com/spring-projects/spring-ai)
6. yudaocode/spring-ai-plus: An Application Framework for AI Engineering - GitHub, 访问时间为 四月 28, 2025， [https://github.com/yudaocode/spring-ai-plus](https://github.com/yudaocode/spring-ai-plus)
7. Introduction :: Spring AI Reference, 访问时间为 四月 28, 2025， [https://docs.spring.io/spring-ai/reference/](https://docs.spring.io/spring-ai/reference/)
8. langchain4j/README.md at main - GitHub, 访问时间为 四月 28, 2025， [https://github.com/langchain4j/langchain4j/blob/main/README.md](https://github.com/langchain4j/langchain4j/blob/main/README.md)
9. langchain4j/langchain4j: Java version of LangChain - GitHub, 访问时间为 四月 28, 2025， [https://github.com/langchain4j/langchain4j](https://github.com/langchain4j/langchain4j)
10. langchain4j/docs/docs/intro.md at main - GitHub, 访问时间为 四月 28, 2025， [https://github.com/langchain4j/langchain4j/blob/main/docs/docs/intro.md](https://github.com/langchain4j/langchain4j/blob/main/docs/docs/intro.md)
11. lucasnscr/SpringAI - GitHub, 访问时间为 四月 28, 2025， [https://github.com/lucasnscr/SpringAI](https://github.com/lucasnscr/SpringAI)
12. ThomasVitale/llm-apps-java-spring-ai: Samples showing how to build Java applications powered by Generative AI and LLMs using Spring AI and Spring Boot. - GitHub, 访问时间为 四月 28, 2025， [https://github.com/ThomasVitale/llm-apps-java-spring-ai](https://github.com/ThomasVitale/llm-apps-java-spring-ai)
13. Building Effective Agents with Spring AI (Part 1), 访问时间为 四月 28, 2025， [https://spring.io/blog/2025/01/21/spring-ai-agentic-patterns/](https://spring.io/blog/2025/01/21/spring-ai-agentic-patterns/)
14. spring-ai-mcp/README.md at main - GitHub, 访问时间为 四月 28, 2025， [https://github.com/spring-projects-experimental/spring-ai-mcp/blob/main/README.md](https://github.com/spring-projects-experimental/spring-ai-mcp/blob/main/README.md)
15. Spring AI with NVIDIA LLM API, 访问时间为 四月 28, 2025， [https://spring.io/blog/2024/08/20/spring-ai-with-nvidia-llm-api](https://spring.io/blog/2024/08/20/spring-ai-with-nvidia-llm-api)
16. Using Multiple LLMs in Java with Spring AI - YouTube, 访问时间为 四月 28, 2025， [https://www.youtube.com/watch?v=bK1MTlEDQvk&pp=0gcJCfcAhR29_xXO](https://www.youtube.com/watch?v=bK1MTlEDQvk&pp=0gcJCfcAhR29_xXO)
17. danvega/awesome-spring-ai - GitHub, 访问时间为 四月 28, 2025， [https://github.com/danvega/awesome-spring-ai](https://github.com/danvega/awesome-spring-ai)
18. spring-projects/spring-ai-examples - GitHub, 访问时间为 四月 28, 2025， [https://github.com/spring-projects/spring-ai-examples](https://github.com/spring-projects/spring-ai-examples)
19. spring-projects spring-ai · Discussions - GitHub, 访问时间为 四月 28, 2025， [https://github.com/spring-projects/spring-ai/discussions](https://github.com/spring-projects/spring-ai/discussions)
20. ThomasVitale/langchain4j-spring-boot - GitHub, 访问时间为 四月 28, 2025， [https://github.com/ThomasVitale/langchain4j-spring-boot](https://github.com/ThomasVitale/langchain4j-spring-boot)
21. langchain4j/docs/docs/tutorials/rag.md at main - GitHub, 访问时间为 四月 28, 2025， [https://github.com/langchain4j/langchain4j/blob/main/docs/docs/tutorials/rag.md](https://github.com/langchain4j/langchain4j/blob/main/docs/docs/tutorials/rag.md)
22. langchain4j/docs/docs/tutorials/ai-services.md at main - GitHub, 访问时间为 四月 28, 2025， [https://github.com/langchain4j/langchain4j/blob/main/docs/docs/tutorials/ai-services.md](https://github.com/langchain4j/langchain4j/blob/main/docs/docs/tutorials/ai-services.md)
23. LangChain4j - GitHub, 访问时间为 四月 28, 2025， [https://github.com/langchain4j](https://github.com/langchain4j)
24. langchain4j/docs/docs/get-started.md at main - GitHub, 访问时间为 四月 28, 2025， [https://github.com/langchain4j/langchain4j/blob/main/docs/docs/get-started.md](https://github.com/langchain4j/langchain4j/blob/main/docs/docs/get-started.md)
25. langchain4j/docs/docs/integrations/embedding-models/open-ai.md at main - GitHub, 访问时间为 四月 28, 2025， [https://github.com/langchain4j/langchain4j/blob/main/docs/docs/integrations/embedding-models/open-ai.md](https://github.com/langchain4j/langchain4j/blob/main/docs/docs/integrations/embedding-models/open-ai.md)
26. Build a LLM-Powered Endpoint with Spring Boot & Spring AI | Ollama Integration Tutorial, 访问时间为 四月 28, 2025， [https://www.youtube.com/watch?v=eduRWlc0CYA](https://www.youtube.com/watch?v=eduRWlc0CYA)