import { orbitNodes, orbitNodeStyle } from "../../data/content";
import saraloAiPlus from "../../assets/saralo-ai-plus.png";

export function OrbitEcosystem() {
  return (
    <div className="orbit-stage" aria-label="Saralo cognitive accessibility ecosystem">
      {/* Concentric orbit rings */}
      <div className="orbit orbit--one" />
      <div className="orbit orbit--two" />
      <div className="orbit orbit--three" />
      <div className="orbit orbit--four" />

      {/* Center hub with counter */}
      <div className="orbit-hub">
        <img src={saraloAiPlus} alt="Saralo AI plus" />
      </div>

      {/* Ecosystem nodes */}
      {orbitNodes.map((node) => (
        <figure
          className={`orbit-node orbit-node--${node.shape}`}
          key={node.label}
          style={orbitNodeStyle(node)}
        >
          <img src={node.asset} alt="" loading="lazy" />
          <figcaption>{node.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}
