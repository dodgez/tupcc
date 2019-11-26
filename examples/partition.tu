(define getN
  (lambda (tup n)
    (if (gt n 0) (
      (getN (tail tup) (- n 1))
    ) (
      (head tup)
    ))
  )
)

(define getMN
  (lambda (tup m n)
    (getN (getN tup m) n)
  )
)

(define setN
  (lambda (tup n value)
    (if (gt n 0) (
      (cat (tuple (head tup)) (setN (tail tup) (- n 1) value))
    ) (
      (cat (tuple value) (tail tup))
    ))
  )
)

(define setMN
  (lambda (tup m n value)
    (setN tup m (setN (getN tup m) n value))
  )
)

(define getPartitions
  (lambda (n parts)
    (define data (tuple))

    (define part 0)
    (define m 0)
    (while (lt part (+ (len parts) 1))
      (set data (cat data (tuple (tuple))))

      (set m 0)
      (while (lt m (+ n 1))
        (set data (setN data part (cat (getN data part) (tuple 0))))

        (if (neq part 0) (
          (if (gt (getN parts (- part 1)) m) (
            (set data (setMN data part m (getMN data (- part 1) m)))
          ) (
            (if (eq (getN parts (- part 1)) m) (
              (set data (setMN data part m (+ (getMN data (- part 1) m) 1)))
            ) (
              (set data (setMN data part m (+ (getMN data (- part 1) m) (getMN data part (- m (getN parts (- part 1)))))))
            ))
          ))
        ) ())

        (set m (+ m 1))
      )

      (set part (+ part 1))
    )

    (getMN data (len parts) n)
  )
)

// Find the number of ways to partition the number 50
//  using partition sizes 1, 2, 5, 10, 20, 50
(print (getPartitions 50 (tuple 1 2 5 10 20 50)))
