import { getFlowById } from "@/lib/diagnostic-flows/index";
import type {
  DiagnosticNode,
  DiagnosticQuestionNode,
} from "@/types/diagnostic";

describe("DiagnosticFlow", () => {
  describe("getFlowById", () => {
    it("should return flow for valid id 'levis'", () => {
      const flow = getFlowById("levis");
      expect(flow).toBeDefined();
      expect(flow).not.toBeNull();
    });

    it("should return undefined for unknown id", () => {
      const flow = getFlowById("nonexistent-brand-xyz");
      expect(flow).toBeUndefined();
    });

    it("should return flow with at least one root node", () => {
      const flow = getFlowById("levis");
      expect(flow).toBeDefined();
      const rootNode = flow!.nodes.find((n) => n.id === flow!.rootNodeId);
      expect(rootNode).toBeDefined();
    });
  });

  describe("DiagnosticNode", () => {
    it("should have question nodes with options array", () => {
      const flow = getFlowById("levis");
      expect(flow).toBeDefined();
      const questionNodes = flow!.nodes.filter(
        (n): n is DiagnosticQuestionNode => n.type === "question",
      );
      expect(questionNodes.length).toBeGreaterThan(0);
      for (const node of questionNodes) {
        expect(Array.isArray(node.options)).toBe(true);
        expect(node.options.length).toBeGreaterThan(0);
      }
    });

    it("should have result nodes with era and rationale", () => {
      const flow = getFlowById("levis");
      expect(flow).toBeDefined();
      const resultNodes = flow!.nodes.filter((n) => n.type === "result");
      expect(resultNodes.length).toBeGreaterThan(0);
      for (const node of resultNodes) {
        if (node.type !== "result") continue;
        expect(typeof node.result.era).toBe("string");
        expect(node.result.era.length).toBeGreaterThan(0);
        expect(typeof node.result.rationale).toBe("string");
        expect(node.result.rationale.length).toBeGreaterThan(0);
      }
    });

    it("should allow traversal from root to result", () => {
      const flow = getFlowById("levis");
      expect(flow).toBeDefined();

      const nodeMap = new Map<string, DiagnosticNode>(
        flow!.nodes.map((n) => [n.id, n]),
      );

      // ルートノードから1つの選択肢を辿り、次のノードに到達できることを確認
      const root = nodeMap.get(flow!.rootNodeId);
      expect(root).toBeDefined();
      expect(root!.type).toBe("question");

      const questionRoot = root as DiagnosticQuestionNode;
      expect(questionRoot.options.length).toBeGreaterThan(0);

      const firstOption = questionRoot.options[0];
      expect(firstOption.nextNodeId).toBeDefined();
      const nextNode = nodeMap.get(firstOption.nextNodeId);
      expect(nextNode).toBeDefined();
    });
  });
});
