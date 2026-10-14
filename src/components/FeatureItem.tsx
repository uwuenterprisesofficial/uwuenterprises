interface FeatureItemProps { icon: string; title: string; desc: string }

export default function FeatureItem({ icon, title, desc }: FeatureItemProps) {
  return (
    <div className="feature">
      <div className="feature-ico" aria-hidden>{icon}</div>
      <div>
        <h4>{title}</h4>
        <p>{desc}</p>
      </div>
    </div>
  );
}
