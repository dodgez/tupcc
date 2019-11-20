(define fib
  (lambda (a b n)
    (if (lte n 0) (
      (tuple)
    ) (
      (define result (fib b (+ a b) (- n 1)))
      (cat (tuple a) result)
    ))
  )
)

(print (fib 1 1 13))
(print (fib 1 2 13))
