(define last
  (lambda (tup)
    (if (eq (len tup) 1) (
      (head tup)
    ) (
      (last (tail tup))
    ))
  )
)

(print (last (tuple 1 2 3 4 5)))

(define reverse
  (lambda (tup)
    (if (eq (len tup) 1) (
      (tuple (head tup))
    ) (
      (cat (reverse (tail tup)) (tuple (head tup)))
    ))
  )
)

(set last
  (lambda (tup)
    (head (reverse tup))
  )
)

(print (last (tuple 1 2 3 4 5)))
