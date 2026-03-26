import { AgenticHooks } from "./types.js";
import { getHooks } from "./mission.js";

export function proxyModel(agent: any) {
  const originalModel = agent.settings?.model;
  if (!originalModel) return undefined;

  if (originalModel._isProxiedForAgentic) return originalModel;

  const modelProxy = new Proxy(originalModel, {
    get(mTarget, mProp, mReceiver) {
      const val = Reflect.get(mTarget, mProp, mReceiver);
      if (mProp === "doGenerate" || mProp === "doStream") {
        return async (...mArgs: any[]) => {
          const hooks = getHooks();
          const { onText, transformPrompt } = hooks || {};

          if (transformPrompt) mArgs[0] = await transformPrompt(mArgs[0]);
          
          const result = await val.apply(mTarget, mArgs);
          
          if (onText) {
            handleTextIntercept(mProp, result, onText);
          }
          return result;
        };
      }
      return val;
    }
  });

  modelProxy._isProxiedForAgentic = true;
  return modelProxy;
}

function handleTextIntercept(methodName: string | symbol, result: any, onText: (text: string) => void) {
  if (methodName === "doGenerate") {
    const textParts = result.content?.filter((p: any) => p.type === "text" || p.type === "reasoning");
    if (textParts?.length > 0) {
      onText(textParts.map((p: any) => p.text || p.reasoning).join("\n"));
    }
  } else if (result.stream) {
    // We use a TransformStream to "spy" on chunks without consuming the stream ourselves.
    // This allows the AI SDK to consume the stream normally to resolve result.text.
    const transformer = new TransformStream({
      transform(chunk, controller) {
        if ((chunk.type === "text-delta" || chunk.type === "reasoning-delta") && chunk.delta) {
          onText(chunk.delta);
        }
        controller.enqueue(chunk);
      }
    });

    result.stream = result.stream.pipeThrough(transformer);
  }
}
