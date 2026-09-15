// Animation features for LazyMotion, loaded after the first render: the page's
// first paint does not wait for animation code (only the hero, disclosures and
// overlays animate, and they work as soon as this small chunk arrives).
import { domAnimation } from "framer-motion";

export default domAnimation;
