(define slice
  (lambda (tup start end) (
    (if (gt start 0) (
      (slice (tail tup) (- start 1) (- end 1))
    ) (
      (if (and (gt end 0) ) (
        (cat (tuple (head tup)) (slice (tail tup) start (- end 1)))
      ) (
        (tuple)
      ))
    ))
  ))
)

(print (slice (tuple 1 2 3 4 5) 1 3))
(print (slice (tuple 1 2 3 4 5) 3 2))
