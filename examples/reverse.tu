(define reverse
  (lambda (tup)
    (if (eq (len tup) 1) (
      (tuple (head tup))
    ) (
      (cat (reverse (tail tup)) (tuple (head tup)))
    ))
  )
)

(print (reverse (tuple 1 2 3)))
(print (reverse "Hello, World!"))
