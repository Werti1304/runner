import { add, dot, normalize, scale, sub, Vec2, vec2, vec_len } from "./Vec2.js";

// a single point (mass)
export interface Mass {
  position: Vec2;
  velocity: Vec2;
  acceleration: Vec2; // acceleration at current step
  accelerationNext: Vec2; // acceleration at next position (mid-step cache)
  mass: number;
  pinned: boolean;
}

// a spring connecting two masses
export interface Spring {
  // Indices of masses
  massA: number;
  massB: number;
  restLength: number; // length if not compressed / pulled
  stiffness: number; // stiffness k (N / m)
  dampening: number; // velocity dampening d (N - s / m)
}

export class MassSpringSystem {
  private readonly gravity: number = 980;

  masses: Mass[] = [];
  springs: Spring[] = [];

  // create new mass, put it into this.masses and return index
  buildMass(x: number, y: number, mass: number = 1.0, pinned: boolean = false): number {
    this.masses.push({
      position: vec2(x, y),
      velocity: vec2(0, 0),
      acceleration: vec2(0, 0),
      accelerationNext: vec2(0, 0),
      mass,
      pinned,
    });
    return this.masses.length - 1;
  }

  // create new spring, put it into this.springs and return index
  buildSpring(
    indexA: number,
    indexB: number,
    stiffness: number = 100,
    dampening: number = 0,
    restLength: number = 100,
  ): number {
    this.springs.push({
      massA: indexA,
      massB: indexB,
      restLength: restLength,
      stiffness,
      dampening: dampening,
    });
    return this.springs.length - 1;
  }

  /// Simulation

  initialize(): void {
    this.computeAccelerations("current");
  }

  // compute net Hookean and dampening force on every mass
  // converted to acceleration
  // results written to:
  // current -> mass.acceleration
  //next -> mass.accelerationNext
  private computeAccelerations(target: "current" | "next"): void {
    // zero out current acc
    for (const m of this.masses) {
      if (target === "current") {
        m.acceleration = vec2(0, 0);
      } else {
        m.accelerationNext = vec2(0, 0);
      }
    }

    // accumulate  spring forces
    for (const spring of this.springs) {
      const mA = this.masses[spring.massA];
      const mB = this.masses[spring.massB];

      const delta = sub(mB.position, mA.position);
      const currentLen = vec_len(delta);
      if (currentLen < 1e-10) continue;

      const unit = normalize(delta);

      // Hookean Force: F = -k * x
      const stretch = currentLen - spring.restLength;
      const hookForce = scale(unit, spring.stiffness * stretch);

      // some dampening is needed, otherwise it oscillates forever upon the smallest force
      const vRel = sub(mB.velocity, mA.velocity);
      const dampForce = scale(unit, spring.dampening * dot(vRel, unit));

      const totalForce = add(hookForce, dampForce);

      // 3rd Newton law: equal force on each end
      if (!mA.pinned) {
        const aContrib = scale(totalForce, 1 / mA.mass);
        if (target === "current") {
          mA.acceleration = add(mA.acceleration, aContrib);
        } else {
          mA.accelerationNext = add(mA.accelerationNext, aContrib);
        }
      }

      if (!mB.pinned) {
        const bContrib = scale(totalForce, -1 / mB.mass);
        if (target === "current") {
          mB.acceleration = add(mB.acceleration, bContrib);
        } else {
          mB.accelerationNext = add(mB.accelerationNext, bContrib);
        }
      }
    }

    // Gravity
    for (const m of this.masses) {
      if (m.pinned) continue;
      if (target === "current") {
        m.acceleration.y += this.gravity / m.mass;
      } else {
        m.accelerationNext.y += this.gravity / m.mass;
      }
    }
  }

  // external factors (in our case gravity) are set from the outside
  // Inspired by https://plainenglish.io/python/molecular-dynamics-velocity-verlet-integration-with-python-5ae66b63a8fd
  step(delta: number): void {
    // Step 1: update positions
    for (const m of this.masses) {
      // if unmovable, don't update position
      if (m.pinned) continue;

      m.position.x += m.velocity.x * delta + 0.5 * m.acceleration.x * delta * delta;
      m.position.y += m.velocity.y * delta + 0.5 * m.acceleration.y * delta * delta;
    }

    // Step 2: Find the total force (acceleration) on each particle (mass)
    this.computeAccelerations("next");

    // Step 3: Update velocities
    for (const m of this.masses) {
      if (m.pinned) continue;

      m.velocity.x += 0.5 * (m.acceleration.x + m.accelerationNext.x) * delta;
      m.velocity.y += 0.5 * (m.acceleration.y + m.accelerationNext.y) * delta;

      // next becomes current
      m.acceleration.x = m.accelerationNext.x;
      m.acceleration.y = m.accelerationNext.y;
    }
  }

  /// helpers

  // return all of the kinetic energy accross all masses (only for debugging)
  kineticEnergy(): number {
    let energy = 0;
    for (const m of this.masses) {
      energy += 0.5 * m.mass * (m.velocity.x ** 2 + m.velocity.y ** 2);
    }
    return energy;
  }

  // return the (elastic) potential energye accross all springs
  potentialEnergy(): number {
    let energy = 0;
    for (const spring of this.springs) {
      const mA = this.masses[spring.massA];
      const mB = this.masses[spring.massB];
      const delta = sub(mB.position, mA.position);
      const stretch = vec_len(delta) - spring.restLength;
      energy += 0.5 * spring.stiffness * stretch * stretch;
    }
    return energy;
  }

  totalEnergy(): number {
    return this.kineticEnergy() + this.potentialEnergy();
  }
}
