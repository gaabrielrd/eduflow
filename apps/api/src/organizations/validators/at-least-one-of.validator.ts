import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  type ValidationArguments
} from "class-validator";

@ValidatorConstraint({ name: "atLeastOneOf", async: false })
export class AtLeastOneOfValidator implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments) {
    const object = args.object as Record<string, unknown>;
    const [keys] = args.constraints as [string[]];

    return keys.some((key) => {
      const value = object[key];

      return typeof value === "string" ? value.trim().length > 0 : value != null;
    });
  }

  defaultMessage(args: ValidationArguments) {
    const [keys] = args.constraints as [string[]];

    return `at least one of ${keys.join(", ")} must be provided`;
  }
}
