(define range
  (lambda (a b) (
    (if (gte a b) (
      (tuple)
    ) (
      (cat (tuple a) (range (+ a 1) b))
    ))
  ))
)

(print (range 2 10))
(print (range 2 1))
