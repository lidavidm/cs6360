# Level Design

## Block Editing/Control Flow/Message Passing

- Block is given to you
- Assemble the block yourself
- Use loops
- Use more methods
    - Gathering iron
    - Funeral for your first robot (selfDestruct)
    - Build solar cells

## Writing Methods

- `turnLeft`
- `vacuum`

## Objects/Classes Conceptually

- Multiple objects given to you
    - Fracking for gas
        - `FrackingRobot` has `pump` and `siphon`
        - There is a vent and a well on the map
        - `siphon` on the well fails unless `pump` as been called while standing on the vent
    - Robot rescue
        - Broken robot has one method `activate` that is user-defined
        - You can only call `activate` if you have a robot adjacent to it
    - Enemy robot
        - An enemy robot came near you and broke down
        - You can call methods on it, but you have to be next to it
        - Similar to robot rescue, but you don't define a method (call selfDestruct instead) (also explosions)
        - Can we get the FF victory theme?

## Instantiation

- Given multiple robot classes each with a specific purpose, pick and choose ones to do:
    - Strip mining robot army (remember vacuum from earlier? This is faster)
    - Draw water from a well
    - Pump waste into a vent

    <!-- don't want to repeat tasks too much -->

## Multiple Classes

- Open the gate for the robot (can be done very early)
- Robot rescue from above

## Inheritance

Concepts:
  * Subclasses understand superclass methods
  * Subclass methods may do different things
  * Superclasses can't use subclass methods

- You have a fracking robot but there happens to be some iron on the way
- Override `moveForward` to always call `pickUp`
- A task from before, but the robot we give you is the superclass (i.e. you have to instantiate your own one of the appropriate type)
