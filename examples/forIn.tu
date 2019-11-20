(define inc (lambda (x) (+ x 1)))

(define getN
  (lambda (tup n)
    (if (gt n 0) (
      (getN (tail tup) (- n 1))
    ) (
      (head tup)
    ))
  )
)

(define forIn
  (lambda (tup func)
    (define count 0)
    (define value 0)
    (define returns (tuple))
    (while (lt count (len tup))
      (set value (getN tup count))
      (set count (+ count 1))
      (set returns (cat returns (tuple (func value))))
    )
  )
)

(print (forIn (tuple 1 2 3) inc))
