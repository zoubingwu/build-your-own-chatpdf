import localFont from "next/font/local";
import { trpc } from "@/utils/trpc";
import { useState } from "react";
import { useLocalStorage } from "react-use";
import clsx from "clsx";
import { ollama } from "ollama-ai-provider";
import { embed, streamText } from "ai";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

function useChat() {
  const [chatResult, setChatResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const ask = async (prompt: string) => {
    setChatResult("");
    setLoading(true);
    const result = await streamText({
      model: ollama("llama3.2"),
      prompt,
    });
    setLoading(false);
    for await (const chunk of result.textStream) {
      setChatResult((prev) => prev + chunk);
    }
  };

  return { result: chatResult, ask, isPending: loading };
}

function Prepare({ onNext }: { onNext: () => void }) {
  const [conn, setConn] = useLocalStorage("conn", "");
  const testConnection = trpc.testConnection.useMutation();
  const { result, ask, isPending } = useChat();

  const onTestConnection = () => {
    if (testConnection.isPending) return;
    testConnection.mutate({ conn: btoa(conn || "") });
  };

  const onTestLLM = async () => {
    await ask("Hello, world!");
  };

  return (
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start lg:max-w-2xl">
      <h1 className="text-2xl font-bold">Build your own chatPDF</h1>
      <form>
        <ol className="list-inside list-decimal text-sm text-center sm:text-left">
          <li className="mb-4">
            <span>
              {" "}
              Go to{" "}
              <a
                href="https://tidbcloud.com"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                TiDB Cloud
              </a>{" "}
              to create a TiDB Serverless cluster and get the connection string.
              This will be used to store all the embeddings and run vector
              search.
            </span>
            <label className="input input-bordered flex items-center gap-2 mt-2">
              <input
                type="password"
                className="grow"
                placeholder="your database connection string"
                autoComplete="off"
                value={conn}
                onChange={(e) => setConn(e.target.value)}
              />
            </label>

            <div className="flex gap-2 mt-2">
              <button
                className="btn btn-secondary btn-sm"
                type="button"
                onClick={onTestConnection}
              >
                Test connection
              </button>

              <div className="flex items-center gap-2">
                {testConnection.isPending && <span>Testing...</span>}
                {testConnection.data?.success === false && (
                  <span className="text-error">
                    {testConnection.data.error}
                  </span>
                )}
                {testConnection.data?.success === true && (
                  <span className="text-success">
                    Successfully connected to {testConnection.data.data}
                  </span>
                )}
              </div>
            </div>
          </li>

          <li>
            <span>
              Setup{" "}
              <a
                href="https://ollama.com"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                ollama
              </a>
              , this runs the LLM for text generation and text embeddings on
              your local machine. For example if you are on a mac, you can just
              run following commands in your terminal:
              <div className="mockup-code my-2">
                <pre data-prefix="" className="text-info-content">
                  <code># install ollama and start the server</code>
                </pre>
                <pre data-prefix="$">
                  <code>brew install ollama && ollama serve</code>
                </pre>
                <pre></pre>
                <pre data-prefix="" className="text-info-content">
                  <code># open another terminal window and run</code>
                </pre>
                <pre data-prefix="$">
                  <code>ollama pull nomic-embed-text</code>
                </pre>
                <pre data-prefix="$">
                  <code>ollama run llama3.2</code>
                </pre>
              </div>
            </span>

            <span>
              Now you have ollama running on your local machine on port 11434!
            </span>

            <button
              className="btn btn-secondary btn-sm my-2"
              type="button"
              onClick={onTestLLM}
            >
              Say hello to ollama
            </button>
            {isPending && <div>Loading...</div>}
            <div>{result}</div>
          </li>
        </ol>

        <button className="btn btn-primary mt-4" type="button" onClick={onNext}>
          Next
        </button>
      </form>
    </main>
  );
}

function Embedding({
  onNext,
  onPrev,
}: { onNext: () => void; onPrev: () => void }) {
  const [embedding, setEmbedding] = useState<number[] | null>(null);

  const onTestEmbedding = async () => {
    const result = await embed({
      model: ollama.textEmbeddingModel("nomic-embed-text"),
      value: "Dog",
    });
    setEmbedding(result.embedding);
  };

  return (
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start lg:max-w-2xl">
      <h1 className="text-2xl font-bold">Embedding</h1>
      <div className="flex flex-col gap-2 text-sm">
        <p>
          Text embedding is a technique to convert text into numerical vectors
          (arrays of numbers) that capture the semantic meaning of the text.
        </p>

        <p>For example, we can ask ollama to embed the text "Dog":</p>

        <div>
          <button
            className="btn btn-secondary btn-sm"
            type="button"
            onClick={onTestEmbedding}
          >
            try embedding "Dog"
          </button>
        </div>

        {embedding && (
          <>
            <p className="truncate max-w-2xl">{JSON.stringify(embedding)}</p>
            <p>
              This embedding is a {embedding.length}-dimensional vector (an
              array of {embedding.length} numbers) that represents the semantic
              meaning of the text "Dog".
            </p>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <button className="btn btn-secondary" type="button" onClick={onPrev}>
          Previous
        </button>
        <button className="btn btn-primary" type="button" onClick={onNext}>
          Next
        </button>
      </div>
    </main>
  );
}

function VectorSearch({
  onNext,
  onPrev,
}: { onNext: () => void; onPrev: () => void }) {
  return (
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start lg:max-w-2xl">
      <h1 className="text-2xl font-bold">Vector Search</h1>

      <div className="flex gap-2">
        <button className="btn btn-secondary" type="button" onClick={onPrev}>
          Previous
        </button>
        <button className="btn btn-primary" type="button" onClick={onNext}>
          Next
        </button>
      </div>
    </main>
  );
}

function Reranking({
  onNext,
  onPrev,
}: { onNext: () => void; onPrev: () => void }) {
  return (
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start lg:max-w-2xl">
      <h1 className="text-2xl font-bold">Reranking</h1>

      <div className="flex gap-2">
        <button className="btn btn-secondary" type="button" onClick={onPrev}>
          Previous
        </button>
        <button className="btn btn-primary" type="button" onClick={onNext}>
          Next
        </button>
      </div>
    </main>
  );
}

function ChatWithAI({
  onNext,
  onPrev,
}: { onNext: () => void; onPrev: () => void }) {
  return (
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start lg:max-w-2xl">
      <h1 className="text-2xl font-bold">Chat with AI</h1>

      <div className="flex gap-2">
        <button className="btn btn-secondary" type="button" onClick={onPrev}>
          Previous
        </button>
        <button className="btn btn-primary" type="button" onClick={onNext}>
          Next
        </button>
      </div>
    </main>
  );
}

export default function Home() {
  const [step, setStep] = useState(0);
  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const content = (() => {
    if (step === 0) return <Prepare onNext={nextStep} />;
    if (step === 1) return <Embedding onNext={nextStep} onPrev={prevStep} />;
    if (step === 2) return <VectorSearch onNext={nextStep} onPrev={prevStep} />;
    if (step === 3) return <Reranking onNext={nextStep} onPrev={prevStep} />;
    if (step === 4) return <ChatWithAI onNext={nextStep} onPrev={prevStep} />;

    return null;
  })();

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-mono)]`}
    >
      <ul className="steps">
        {[
          "Prepare",
          "Embedding",
          "Vector Search",
          "Reranking",
          "Chat with AI",
          "Graph RAG",
        ].map((s, i) => (
          <li
            key={s}
            data-content={step > i ? "✓" : undefined}
            className={clsx("step", {
              "step-primary": step >= i,
            })}
          >
            {s}
          </li>
        ))}
      </ul>

      {content}
    </div>
  );
}
