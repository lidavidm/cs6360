//! srs-rs: A Rust implementation of the SuperMemo 2 algorithm, SM2.
//! https://www.supermemo.com/english/ol/sm2.htm

/// The easiness factor (EF).
pub type EasinessFactor = f32;
/// The default easiness factor for new cards.
pub const DEFAULT_EASINESS_FACTOR: EasinessFactor = 2.5;

/// The repetition interval, in days.
pub type Interval = u32;

/// The recollection confidence.
#[derive(Clone,Copy,Debug,PartialEq)]
pub enum Confidence {
    IncorrectBlackout = 0,
    IncorrectRemembered = 1,
    IncorrectEasy = 2,
    CorrectDifficult = 3,
    CorrectHesitation = 4,
    CorrectPerfect = 5,
}

/// Calculate a new easiness factor based on the confidence.
pub fn new_easiness_factor(ef: EasinessFactor, confidence: Confidence)
                           -> EasinessFactor {
    let q = (confidence as i32) as f32;
    f32::min(1.3, ef + (0.1 - (5.0 - q) * (0.08 + (5.0 - q) * 0.02)))
}

/// Calculate the new interval, times seen, and easiness factor. This
/// function computes all three values because a low confidence can
/// reset the times seen.
pub fn new_interval(times_seen: u32, interval_days: Interval, ef: EasinessFactor,
                    confidence: Confidence)
                    -> (Interval, u32, EasinessFactor) {
    let new_interval = match times_seen {
        0 => 1,
        1 => 6,
        _ => f32::ceil((interval_days as f32) * ef) as u32,
    };

    if (confidence as i32) < 3 {
        (new_interval, 0, new_easiness_factor(ef, confidence))
    }
    else {
        (new_interval, times_seen + 1, new_easiness_factor(ef, confidence))
    }
}

#[cfg(test)]
mod test {
    #[test]
    fn it_works() {
    }
}
