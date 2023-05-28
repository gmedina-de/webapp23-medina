/**
 * @fileOverview  Defines error classes (also called "exception" classes)
 * for property constraint violations
 */
class ConstraintViolation {
  constructor(msg) {
    this.trace = "\n Trace: \n" + Error().stack;
    this.message = msg;
  }
}
class NoConstraintViolation extends ConstraintViolation {
  constructor(msg, v) {
    super(msg);
    if (v !== undefined) this.checkedValue = v;
    this.message = "";
  }
}
class MandatoryValueConstraintViolation extends ConstraintViolation {
  constructor(msg) {
    super(msg);
  }
}
class RangeConstraintViolation extends ConstraintViolation {
  constructor(msg) {
    super(msg);
  }
}
class StringLengthConstraintViolation extends ConstraintViolation {
  constructor(msg) {
    super(msg);
  }
}
class IntervalConstraintViolation extends ConstraintViolation {
  constructor(msg) {
    super(msg);
  }
}
class PatternConstraintViolation extends ConstraintViolation {
  constructor(msg) {
    super(msg);
  }
}
class UniquenessConstraintViolation extends ConstraintViolation {
  constructor(msg) {
    super(msg);
  }
}
class ReferentialIntegrityConstraintViolation extends ConstraintViolation {
  constructor(msg) {
    super(msg);
  }
}
class FrozenValueConstraintViolation extends ConstraintViolation {
  constructor(msg) {
    super(msg);
  }
}

export {
  ConstraintViolation, NoConstraintViolation,
  MandatoryValueConstraintViolation, RangeConstraintViolation,
  StringLengthConstraintViolation, IntervalConstraintViolation,
  PatternConstraintViolation, UniquenessConstraintViolation,
  ReferentialIntegrityConstraintViolation, FrozenValueConstraintViolation
};
