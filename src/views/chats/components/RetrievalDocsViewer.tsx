import allImgPaths from "@/assets";
import { Drawer, DrawerHeader } from "@/components";
import { useTranslate } from "@/hooks";
import { orderBy, upperFirst } from "lodash-es";

/**
 * RetrievalDocsViewer component for displaying citation documents in a drawer
 * @param show - Boolean to control visibility of the drawer
 * @param onClose - Function to handle closing the drawer
 * @returns A drawer component displaying citation documents
 */
const RetrievalDocsViewer = ({
  show,
  onClose,
}: {
  show: boolean;
  onClose: () => void;
}) => {
  const { translate } = useTranslate();

  /**
   * Dummy data array with 20 records for document/KEs
   * Each record contains type, title, documentId, KEId, documentURL, description, createdAt, and score
   */
  const documentList = [
    {
      type: "document",
      title:
        "Artificial Intelligence in Healthcare: Current Applications and Future Prospects",
      documentId: "doc-001-2025",
      KEId: "",
      documentURL:
        "https://medical-journals.org/ai-healthcare-applications-2025.pdf",
      description:
        "A comprehensive review of AI applications in healthcare, focusing on diagnostic tools, treatment planning, and patient care optimization.",
      createdAt: "2025-05-20T08:30:15Z",
      score: 0.95,
    },
    {
      type: "KEs",
      title:
        "Machine Learning Models for Predictive Maintenance in Manufacturing",
      documentId: "",
      KEId: "ke-2025-ml-001",
      documentURL:
        "https://industrial-research.org/predictive-maintenance-ml.html",
      description:
        "Knowledge entry on implementing machine learning algorithms for predicting equipment failures and optimizing maintenance schedules.",
      createdAt: "2025-05-18T14:22:45Z",
      score: 0.89,
    },
    {
      type: "document",
      title: "Quantum Computing: Breaking the Encryption Barrier",
      documentId: "doc-qc-2025-003",
      KEId: "",
      documentURL:
        "https://quantum-research.edu/encryption-challenges-2025.pdf",
      description:
        "Analysis of how quantum computing advancements are challenging current encryption standards and potential solutions.",
      createdAt: "2025-05-15T11:45:30Z",
      score: 0.92,
    },
    {
      type: "KEs",
      title: "Sustainable Energy Solutions for Data Centers",
      documentId: "",
      KEId: "ke-energy-2025-004",
      documentURL:
        "https://green-computing.org/data-center-sustainability.html",
      description:
        "Best practices for implementing renewable energy sources and improving energy efficiency in large-scale data centers.",
      createdAt: "2025-05-12T09:15:00Z",
      score: 0.78,
    },
    {
      type: "document",
      title: "Blockchain Applications in Supply Chain Management",
      documentId: "doc-blockchain-005",
      KEId: "",
      documentURL:
        "https://logistics-tech.com/blockchain-supply-chain-2025.pdf",
      description:
        "Case studies of successful blockchain implementations for improving transparency and efficiency in global supply chains.",
      createdAt: "2025-05-10T16:40:22Z",
      score: 0.85,
    },
    {
      type: "KEs",
      title: "Natural Language Processing for Customer Service Automation",
      documentId: "",
      KEId: "ke-nlp-cs-006",
      documentURL: "https://ai-customer-service.net/nlp-automation-guide.html",
      description:
        "Implementation strategies for NLP-powered chatbots and virtual assistants in customer service operations.",
      createdAt: "2025-05-08T13:25:10Z",
      score: 0.91,
    },
    {
      type: "document",
      title: "Cybersecurity Threats in IoT Environments",
      documentId: "doc-sec-iot-007",
      KEId: "",
      documentURL: "https://security-research.org/iot-threats-2025.pdf",
      description:
        "Analysis of emerging security vulnerabilities in Internet of Things ecosystems and mitigation strategies.",
      createdAt: "2025-05-05T10:12:33Z",
      score: 0.88,
    },
    {
      type: "KEs",
      title: "Cloud-Native Architecture Design Patterns",
      documentId: "",
      KEId: "ke-cloud-arch-008",
      documentURL: "https://cloud-patterns.dev/architecture-2025.html",
      description:
        "Best practices and design patterns for building scalable, resilient applications using cloud-native technologies.",
      createdAt: "2025-05-03T15:50:45Z",
      score: 0.83,
    },
    {
      type: "document",
      title: "Augmented Reality in Industrial Training",
      documentId: "doc-ar-ind-009",
      KEId: "",
      documentURL: "https://industrial-ar.edu/training-applications.pdf",
      description:
        "Implementation case studies of AR technologies for improving worker training and reducing errors in industrial settings.",
      createdAt: "2025-04-30T09:20:15Z",
      score: 0.79,
    },
    {
      type: "KEs",
      title: "Microservices Migration Strategies",
      documentId: "",
      KEId: "ke-microservices-010",
      documentURL:
        "https://architecture-patterns.org/microservices-migration.html",
      description:
        "Step-by-step approaches for transitioning monolithic applications to microservices architecture with minimal disruption.",
      createdAt: "2025-04-28T14:15:30Z",
      score: 0.87,
    },
    {
      type: "document",
      title: "Edge Computing for Real-time Analytics",
      documentId: "doc-edge-011",
      KEId: "",
      documentURL: "https://edge-computing.tech/realtime-analytics-2025.pdf",
      description:
        "Frameworks and methodologies for implementing analytics at the edge for latency-sensitive applications.",
      createdAt: "2025-04-25T11:30:00Z",
      score: 0.82,
    },
    {
      type: "KEs",
      title: "DevSecOps Implementation Guide",
      documentId: "",
      KEId: "ke-devsecops-012",
      documentURL: "https://secure-devops.org/implementation-guide-2025.html",
      description:
        "Comprehensive guide to integrating security practices throughout the software development lifecycle.",
      createdAt: "2025-04-22T16:45:20Z",
      score: 0.94,
    },
    {
      type: "document",
      title: "Neuromorphic Computing: Mimicking Brain Architecture",
      documentId: "doc-neuro-013",
      KEId: "",
      documentURL: "https://neural-computing.edu/neuromorphic-systems.pdf",
      description:
        "Research on brain-inspired computing architectures and their applications in pattern recognition and decision-making.",
      createdAt: "2025-04-20T10:10:45Z",
      score: 0.76,
    },
    {
      type: "KEs",
      title: "API Security Best Practices",
      documentId: "",
      KEId: "ke-api-sec-014",
      documentURL: "https://api-security.net/best-practices-2025.html",
      description:
        "Comprehensive guide to securing APIs against common vulnerabilities and implementing robust authentication mechanisms.",
      createdAt: "2025-04-18T13:25:30Z",
      score: 0.9,
    },
    {
      type: "document",
      title: "Ethical Considerations in AI Development",
      documentId: "doc-ai-ethics-015",
      KEId: "",
      documentURL: "https://ai-ethics.org/development-guidelines-2025.pdf",
      description:
        "Framework for addressing ethical challenges in AI development, including bias mitigation and transparency.",
      createdAt: "2025-04-15T09:50:15Z",
      score: 0.93,
    },
    {
      type: "KEs",
      title: "Serverless Architecture Patterns",
      documentId: "",
      KEId: "ke-serverless-016",
      documentURL: "https://serverless-patterns.dev/architecture-guide.html",
      description:
        "Design patterns and implementation strategies for building cost-effective, scalable serverless applications.",
      createdAt: "2025-04-12T15:30:00Z",
      score: 0.84,
    },
    {
      type: "document",
      title: "5G Network Security Challenges",
      documentId: "doc-5g-sec-017",
      KEId: "",
      documentURL: "https://network-security.org/5g-challenges-2025.pdf",
      description:
        "Analysis of security vulnerabilities in 5G network infrastructure and recommended mitigation strategies.",
      createdAt: "2025-04-10T11:15:45Z",
      score: 0.81,
    },
    {
      type: "KEs",
      title: "Data Mesh Architecture Implementation",
      documentId: "",
      KEId: "ke-data-mesh-018",
      documentURL: "https://data-architecture.org/data-mesh-guide.html",
      description:
        "Step-by-step guide to implementing data mesh architecture for distributed data ownership and governance.",
      createdAt: "2025-04-08T14:20:30Z",
      score: 0.86,
    },
    {
      type: "document",
      title: "Explainable AI for Financial Services",
      documentId: "doc-xai-fin-019",
      KEId: "",
      documentURL: "https://financial-ai.org/explainable-ai-2025.pdf",
      description:
        "Methods for implementing transparent AI models in financial decision-making processes to meet regulatory requirements.",
      createdAt: "2025-04-05T10:40:15Z",
      score: 0.89,
    },
    {
      type: "KEs",
      title: "Zero Trust Security Model Implementation",
      documentId: "",
      KEId: "ke-zero-trust-020",
      documentURL: "https://security-models.net/zero-trust-guide.html",
      description:
        "Comprehensive guide to implementing zero trust security architecture in enterprise environments.",
      createdAt: "2025-04-02T16:55:00Z",
      score: 0.97,
    },
  ];

  return (
    <div>
      <Drawer show={show} onClose={onClose} size="sm" id="retrieval-docs">
        <DrawerHeader
          onClose={onClose}
          title={
            <div className="flex justify-between items-center w-full">
              <div>
                <span>{"Sources"}</span>
              </div>
            </div>
          }
        />
        <div className="h-[calc(100vh_-_73px)] overflow-auto p-4 flex flex-col gap-y-2">
          <div className="flex flex-col px-3 py-2">
            {orderBy(documentList, "score", "desc").map(
              ({ documentURL, type, title, description, score, createdAt }) => (
                <div className="" style={{ opacity: 1 }}>
                  <a
                    href={documentURL}
                    target="_blank"
                    rel="noopener"
                    className="flex flex-col gap-0.5 rounded-xl px-3 py-2.5 hover:bg-tertiary-50/50"
                  >
                    <div className="flex gap-x-2 items-center h-6 text-sm line-clamp-1">
                      <img
                        alt="Website favicon"
                        className="object-cover rounded-full opacity-100 duration-200"
                        src={
                          type === "KEs"
                            ? allImgPaths.KE
                            : allImgPaths.documents
                        }
                      />
                      <span>{upperFirst(type)}</span>
                    </div>
                    <div className="text-base font-semibold line-clamp-2">
                      {title}
                    </div>
                    <div className="text-base font-normal leading-snug text-token-text-secondary line-clamp-2">
                      {description}
                    </div>
                    <div className="flex justify-between items-center mt-1 text-sm text-token-text-tertiary">
                      <span>{new Date(createdAt).toLocaleDateString()}</span>
                      <span>Relevance: {score.toFixed(2)}</span>
                    </div>
                  </a>
                </div>
              ),
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default RetrievalDocsViewer;
