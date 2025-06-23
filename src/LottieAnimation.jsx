import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web';

const LottieAnimation = ({ src, speed = 1, className, style }) => {
  const animationContainer = useRef(null); // Ref to the DOM element where Lottie renders
  const anim = useRef(null); // Ref to store the Lottie animation instance
  const timeoutId = useRef(null); // Ref to store the ID of our setTimeout for cleanup

  useEffect(() => {
    if (animationContainer.current) {
      // 1. Destroy any existing animation instance to prevent memory leaks/conflicts
      if (anim.current) {
        anim.current.destroy();
      }

      // 2. Load the animation
      anim.current = lottie.loadAnimation({
        container: animationContainer.current, // The DOM element to render into
        renderer: 'svg', // 'svg' is generally recommended for vector animations
        loop: false, // IMPORTANT: Start with loop set to false
        autoplay: true, // IMPORTANT: Play once immediately
        path: src // Path to your .json file
      });

      // Set animation speed
      anim.current.setSpeed(speed);

      // 3. Define the handler for when the animation completes its first run
      const handleComplete = () => {
        // The animation has played once and is now on its last frame.
        // Set a timer for 3 minutes before it starts looping.
        timeoutId.current = setTimeout(() => {
          if (anim.current) { // Ensure the animation instance still exists
            anim.current.setLoop(true); // Enable looping
            anim.current.goToAndPlay(0, true); // Go to the first frame and start playing indefinitely
          }
        }, 3 * 60 * 1000); // 3 minutes in milliseconds (3 * 60 seconds * 1000 ms/sec)
      };

      // 4. Add the event listener for the 'complete' event
      anim.current.addEventListener('complete', handleComplete);

      // 5. Cleanup function: runs when the component unmounts or before the effect re-runs
      return () => {
        // Destroy the Lottie animation instance
        if (anim.current) {
          anim.current.removeEventListener('complete', handleComplete); // Clean up event listener
          anim.current.destroy();
        }
        // Clear the timeout if it's still pending
        if (timeoutId.current) {
          clearTimeout(timeoutId.current);
        }
      };
    }
  }, [src, speed]); // Dependencies: Re-run this effect if 'src' or 'speed' changes

  return (
    <div
      ref={animationContainer} // Attach the ref to this div
      className={className}
      style={style || {}} // Apply any passed in styles
    />
  );
};

export default LottieAnimation;